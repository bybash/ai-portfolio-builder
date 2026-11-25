import { MAX_MEDIA_BYTES } from "@/lib/media";

const MAX_SIDE = 1800;

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));

// Scales photos down and drops their metadata (a phone photo can carry its
// location). JPEG and PNG only, because LinkedIn takes both. GIFs are sent as
// they are, to keep the animation.
async function prepare(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d")!;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  // Screenshots and transparency stay PNG unless that is too heavy.
  if (file.type !== "image/jpeg") {
    const png = await toBlob(canvas, "image/png");
    if (png && png.size <= 1.5 * 1024 * 1024) return png;
    context.globalCompositeOperation = "destination-over";
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  return (await toBlob(canvas, "image/jpeg")) ?? file;
}

/** Uploads an image from the computer and returns its path on this site. */
export async function uploadImage(file: File, signal?: AbortSignal): Promise<string> {
  let blob: Blob;
  try {
    blob = await prepare(file);
  } catch {
    throw new Error("This file can't be read as an image. Use a JPEG, PNG, GIF or WebP.");
  }
  if (blob.size > MAX_MEDIA_BYTES) throw new Error("The image is over 4 MB.");
  const response = await fetch("/api/admin/media", { method: "POST", body: blob, signal });
  const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error ?? "The upload failed. Try again.");
  return result.url;
}
