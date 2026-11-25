import { siteUrl } from "@/lib/config";
import { MAX_MEDIA_BYTES, sniffImageType } from "@/lib/media";
import { readStoredImage } from "@/lib/media-store";
import { readCapped } from "@/lib/read-capped";

// Only images this site holds: an uploaded one, or a file in public/. The
// server never fetches another host for a visitor, and the file extension
// keeps a cover from pointing at a share image (which would fetch itself).
async function coverBytes(url: string): Promise<Uint8Array | null> {
  if (url.startsWith("/media/")) return (await readStoredImage(url))?.data ?? null;
  if (!/^\/(?!\/)[\w./-]+\.(jpe?g|png)$/i.test(url)) return null;
  const response = await fetch(`${siteUrl}${url}`, { redirect: "error", signal: AbortSignal.timeout(4000) });
  return response.ok ? readCapped(response.body, MAX_MEDIA_BYTES) : null;
}

/** A post's cover for its share image, or null to draw the pixel pattern instead. */
export async function coverDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const bytes = await coverBytes(url);
    const type = bytes && sniffImageType(bytes);
    // The share image renderer reads these two.
    if (!bytes || (type !== "image/jpeg" && type !== "image/png")) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}
