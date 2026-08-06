import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/* ── Firebase init (same config as lib/firebase.ts) ── */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBfeBSE4MUESKvJqbGBE4xOvRPnv2leQ6o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gamanext-matrix-admin.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gamanext-matrix-admin",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gamanext-matrix-admin.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "32000054720",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:32000054720:web:555195a6f11366e053e425",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "gamanext_wa_verify_token";

/**
 * GET — WhatsApp webhook verification handshake
 * Meta calls this when you configure the webhook URL in the dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] ✅ Verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

function normalizePhone(raw: string): string {
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s.startsWith("+")) s = "+" + s;
  return s;
}

/**
 * POST — Incoming WhatsApp messages & status updates from Meta
 * Fires whenever a contact replies or a message status changes (sent/delivered/read).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    /* ── Handle inbound TEXT messages ── */
    const inboundMessages = value?.messages;
    if (inboundMessages && inboundMessages.length > 0) {
      for (const msg of inboundMessages) {
        const from: string = msg.from; // e.g. "918143538314" or "+918143538314"
        const phone = normalizePhone(from);
        const msgBody: string =
          msg?.text?.body ||
          msg?.image?.caption ||
          msg?.document?.filename ||
          (msg?.type ? `[${msg.type} message]` : "[message]");
        const timestamp = new Date(Number(msg.timestamp) * 1000).toISOString();
        const waId: string = msg.id;

        console.log(`[WhatsApp Inbound] From: ${phone} | Body: ${msgBody} | WA ID: ${waId}`);

        /* ── Look up contact name ── */
        let contactName: string | undefined;
        try {
          const contactsRef = collection(db, "whatsapp_contacts");
          const q = query(contactsRef, where("phone", "==", phone));
          const snap = await getDocs(q);
          if (!snap.empty) {
            contactName = (snap.docs[0].data() as { name: string }).name;
          }
          // Also check Meta's display name from the payload
          if (!contactName) {
            const metaContacts = value?.contacts as Array<{ profile: { name: string } }> | undefined;
            contactName = metaContacts?.[0]?.profile?.name;
          }
        } catch (e) {
          // Contact lookup failed, proceed without name
        }

        /* ── Save inbound message to Firestore ── */
        try {
          await addDoc(collection(db, "whatsapp_messages"), {
            phone,
            contactName: contactName || null,
            direction: "inbound",
            type: "text",
            message: msgBody,
            status: "delivered",
            waMessageId: waId,
            timestamp,
            createdAt: new Date().toISOString(),
          });
          console.log(`[WhatsApp Webhook] ✅ Saved inbound message from ${phone}`);
        } catch (err) {
          console.error("[WhatsApp Webhook] ❌ Failed to save inbound message:", err);
        }
      }
    }

    /* ── Handle status updates (sent / delivered / read) ── */
    const statuses = value?.statuses as
      | Array<{ id: string; status: string; timestamp: string; recipient_id: string }>[]
      | undefined;
    if (statuses && statuses.length > 0) {
      for (const s of statuses) {
        const status = (s as unknown as { id: string; status: string }).id
          ? (s as unknown as { id: string; status: string })
          : null;
        if (!status) continue;
        const waId = status.id;
        const newStatus = status.status; // "sent" | "delivered" | "read" | "failed"

        console.log(`[WhatsApp Status] WA ID: ${waId} → ${newStatus}`);

        /* Update message status in Firestore by waMessageId */
        try {
          const msgsRef = collection(db, "whatsapp_messages");
          const q = query(msgsRef, where("waMessageId", "==", waId));
          const snap = await getDocs(q);
          for (const docSnap of snap.docs) {
            const { updateDoc, doc } = await import("firebase/firestore");
            await updateDoc(doc(db, "whatsapp_messages", docSnap.id), {
              status: newStatus,
            });
          }
        } catch (err) {
          console.error("[WhatsApp Webhook] ❌ Failed to update status:", err);
        }
      }
    }

    // Always return 200 OK to Meta within 5 seconds
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[WhatsApp Webhook] Unhandled error:", err);
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
