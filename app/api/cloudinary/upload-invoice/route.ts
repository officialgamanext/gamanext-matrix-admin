import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dk0dn1djj",
  api_key: process.env.CLOUDINARY_API_KEY || "856569781862693",
  api_secret: process.env.CLOUDINARY_API_SECRET || "0afkLnJEuuycoT70A1ph67Ir4Dw",
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, filename, previousPublicId } = body;

    if (!pdfBase64) {
      return NextResponse.json({ error: "No PDF data provided" }, { status: 400 });
    }

    // Strip any extraneous parameters like filename=generated.pdf that jsPDF includes
    let cleanDataUri = pdfBase64;
    if (cleanDataUri.includes(";base64,")) {
      const base64Data = cleanDataUri.split(";base64,")[1];
      cleanDataUri = `data:application/pdf;base64,${base64Data}`;
    } else if (!cleanDataUri.startsWith("data:")) {
      cleanDataUri = `data:application/pdf;base64,${cleanDataUri}`;
    }

    // If an earlier generated PDF existed on Cloudinary, delete it to keep storage clean
    if (previousPublicId) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "raw",
          invalidate: true,
        });
      } catch (delError) {
        console.warn("Could not delete prior invoice from Cloudinary:", delError);
      }
    }

    const cleanName = (filename || `Invoice_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniquePublicId = `${cleanName}_${Date.now()}.pdf`;

    // Upload raw PDF to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(cleanDataUri, {
      folder: "gamanext_invoices",
      resource_type: "raw",
      format: "pdf",
      public_id: uniquePublicId,
      access_mode: "public",
    });

    return NextResponse.json({
      success: true,
      secureUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary invoice upload route error:", error);
    return NextResponse.json(
      { error: error?.message || "Cloudinary upload failed", details: error },
      { status: 500 }
    );
  }
}
