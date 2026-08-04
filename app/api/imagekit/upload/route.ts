import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "/employees";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const privateKey =
      process.env.IMAGEKIT_PRIVATE_KEY || "private_hsCeuLWgJvTSjc02hpRiJfIvGSQ=";

    // Convert file to base64 for ImageKit REST API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString("base64");

    const ikFormData = new FormData();
    ikFormData.append("file", `data:${file.type};base64,${base64File}`);
    ikFormData.append("fileName", `${Date.now()}_${file.name.replace(/\s+/g, "_")}`);
    ikFormData.append("folder", folder);
    ikFormData.append("useUniqueFileName", "true");

    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

    const ikRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: ikFormData,
    });

    if (!ikRes.ok) {
      const errorText = await ikRes.text();
      console.error("ImageKit server upload error:", errorText);
      return NextResponse.json(
        { error: "ImageKit upload failed", details: errorText },
        { status: ikRes.status }
      );
    }

    const data = await ikRes.json();
    return NextResponse.json({ url: data.url, name: data.name, fileId: data.fileId });
  } catch (error: any) {
    console.error("ImageKit route handler error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload", message: error.message },
      { status: 500 }
    );
  }
}
