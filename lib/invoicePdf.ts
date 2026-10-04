import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { CustomerInvoice } from "@/lib/firebase";

/**
 * Captures an HTML invoice element as high-resolution canvas,
 * converts to an A4 PDF document, and uploads it to Cloudinary.
 * Uses html-to-image to support modern CSS color functions (lab, oklch) in Tailwind v4.
 */
export async function generateAndUploadInvoicePdf(
  invoice: CustomerInvoice,
  element: HTMLElement
): Promise<{ secureUrl: string; publicId: string }> {
  // Ensure all images within the element are fully loaded before rendering
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  // Render element to canvas using html-to-image (supports lab/oklch colors natively)
  const canvas = await toCanvas(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const rawDataUri = pdf.output("datauristring");
  const pdfBase64 = rawDataUri.includes(";base64,")
    ? `data:application/pdf;base64,${rawDataUri.split(";base64,")[1]}`
    : rawDataUri;

  const rawBusinessName =
    invoice.customerDetails?.businessName ||
    invoice.customerDetails?.name ||
    "Client";
  const cleanBusinessName = rawBusinessName.replace(/\s+/g, "");
  const invoiceNumber = invoice.invoiceNumber || "INV";
  const filename = `${cleanBusinessName}-${invoiceNumber}`;

  const res = await fetch("/api/cloudinary/upload-invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdfBase64,
      filename,
      previousPublicId: invoice.pdfPublicId,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to upload to Cloudinary");
  }

  const result = await res.json();
  return {
    secureUrl: result.secureUrl,
    publicId: result.publicId,
  };
}

/**
 * Downloads the invoice PDF directly to the user's computer
 */
export async function downloadInvoicePdf(url: string, filename: string): Promise<void> {
  const safeFilename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Cloudinary PDF delivery is restricted on your account. To allow downloads, open Cloudinary Settings > Security > Check 'Allow delivery of PDF and ZIP files' and Save."
        );
      }
      throw new Error(`Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err: any) {
    console.warn("Direct blob download failed:", err);
    if (err?.message && err.message.includes("Cloudinary PDF delivery is restricted")) {
      alert(err.message);
    }
    window.open(url, "_blank");
  }
}
