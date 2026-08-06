import { NextRequest, NextResponse } from "next/server";

const WHATSAPP_API_VERSION = "v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, type = "text" } = body as {
      to: string;
      message: string;
      type?: "text" | "template";
    };

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: to, message" },
        { status: 400 }
      );
    }

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "WhatsApp API not configured. Please set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in your .env.local file.",
        },
        { status: 503 }
      );
    }

    // Normalize phone number to E.164 (strip any + at start if Meta requires no +)
    const normalizedTo = to.replace(/^\+/, "");

    const payload =
      type === "text"
        ? {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizedTo,
            type: "text",
            text: {
              preview_url: false,
              body: message,
            },
          }
        : {
            messaging_product: "whatsapp",
            to: normalizedTo,
            type: "template",
            template: {
              name: message, // treat message as template name for template type
              language: { code: "en_US" },
            },
          };

    const apiUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || "WhatsApp API request failed",
          details: data,
        },
        { status: response.status }
      );
    }

    const waMessageId = data?.messages?.[0]?.id || null;

    return NextResponse.json({
      success: true,
      waMessageId,
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("WhatsApp send route error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
