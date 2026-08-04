/**
 * ImageKit Client Upload Helper
 * Posts image files to ImageKit API route /api/imagekit/upload and returns public CDN image URLs.
 */

export async function uploadToImageKit(
  file: File,
  folderName: string = "employees"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", `/employees/${folderName}`);

    const res = await fetch("/api/imagekit/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    } else {
      console.warn("ImageKit server upload error status:", res.status);
    }
  } catch (err) {
    console.error("Failed to upload image to ImageKit route:", err);
  }

  // Fallback: Convert File to base64 Data URL if network error occurs
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert image file"));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
