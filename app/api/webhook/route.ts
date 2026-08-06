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

/* ── Firebase init ── */
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

function normalizePhone(raw: string): string {
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s.startsWith("+")) s = "+" + s;
  return s;
}

/**
 * GET — Meta Webhook Handshake Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Meta Webhook Verification] ✅ Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST — Step 1: Receive incoming WhatsApp webhook from Meta & Save to Firestore
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        /* ── Inbound Messages ── */
        const inboundMessages = value?.messages;
        if (inboundMessages && inboundMessages.length > 0) {
          for (const msg of inboundMessages) {
            const rawFrom: string = msg.from; // e.g. "919876543210"
            const phone = normalizePhone(rawFrom);
            const rawText: string =
              msg?.text?.body ||
              msg?.image?.caption ||
              msg?.document?.filename ||
              (msg?.type ? `[${msg.type} message]` : "[message]");
            const timestamp = new Date(Number(msg.timestamp) * 1000).toISOString();
            const waId: string = msg.id;

            /* Extract profile name if provided by Meta */
            const metaContact = value?.contacts?.[0];
            const profileName = metaContact?.profile?.name || "";

            /* Look up contact name from Firestore */
            let contactName = profileName;
            try {
              const contactsRef = collection(db, "whatsapp_contacts");
              const q = query(contactsRef, where("phone", "==", phone));
              const snap = await getDocs(q);
              if (!snap.empty) {
                contactName = (snap.docs[0].data() as { name: string }).name;
              }
            } catch (e) {}

            /* Save incoming message to Firestore whatsapp_messages collection */
            try {
              await addDoc(collection(db, "whatsapp_messages"), {
                phone,
                from: rawFrom,
                name: contactName || profileName || phone,
                contactName: contactName || profileName || null,
                direction: "inbound",
                type: msg.type || "text",
                message: rawText,
                text: rawText,
                status: "delivered",
                waMessageId: waId,
                timestamp,
                createdAt: new Date().toISOString(),
              });
              console.log(`[Webhook] ✅ Saved inbound message from ${phone} (${contactName})`);
            } catch (err) {
              console.error("[Webhook] ❌ Firestore write failed:", err);
            }
          }
        }

        /* ── Status Updates (sent / delivered / read / failed) ── */
        const statuses = value?.statuses;
        if (statuses && statuses.length > 0) {
          for (const status of statuses) {
            if (!status?.id) continue;
            const waId = status.id;
            const newStatus = status.status;

            try {
              const msgsRef = collection(db, "whatsapp_messages");
              const q = query(msgsRef, where("waMessageId", "==", waId));
              const snap = await getDocs(q);
              for (const docSnap of snap.docs) {
                const { updateDoc, doc: docRef } = await import("firebase/firestore");
                await updateDoc(docRef(db, "whatsapp_messages", docSnap.id), {
                  status: newStatus,
                });
              }
            } catch (err) {
              console.error("[Webhook] ❌ Status update failed:", err);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[Webhook] Error processing request:", err);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
