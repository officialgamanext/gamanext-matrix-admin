import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "gamanext_wa_verify_token";

/**
 * GET — WhatsApp webhook verification handshake (Meta calls this when you set up the webhook)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST — Incoming WhatsApp messages from Meta
 * This fires when a contact replies to your message.
 * In production, save the inbound message to Firestore here.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Meta sends a 200 OK acknowledgement requirement within 5 seconds
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      for (const msg of messages) {
        const from = msg.from; // sender phone number (no +)
        const msgBody = msg?.text?.body || "";
        const timestamp = new Date(Number(msg.timestamp) * 1000).toISOString();
        const waId = msg.id;

        console.log(`[WhatsApp Inbound] From: +${from} | Message: ${msgBody} | WA ID: ${waId}`);

        // TODO: Save inbound message to Firestore using saveWhatsAppMessage()
        // This requires importing firebase helpers server-side or using Admin SDK.
        // For now, the message is logged. In production, call your firebase helper here.
        // Example:
        // await saveWhatsAppMessage({
        //   phone: `+${from}`,
        //   direction: "inbound",
        //   type: "text",
        //   message: msgBody,
        //   status: "delivered",
        //   waMessageId: waId,
        //   timestamp,
        // });
      }
    }

    // Always return 200 OK to Meta quickly
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ status: "ok" }, { status: 200 }); // Still return 200 to Meta
  }
}
