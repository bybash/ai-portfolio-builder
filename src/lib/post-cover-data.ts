import { siteUrl } from "@/lib/config";
import { MAX_MEDIA_BYTES, sniffImageType } from "@/lib/media";
import { prisma } from "@/lib/prisma";

async function coverBytes(url: string): Promise<Uint8Array | null> {
  const media = url.match(/^\/media\/([\w-]+)\.\w+$/);
  if (media) return (await prisma.media.findUnique({ where: { id: media[1] } }))?.data ?? null;
  const response = await fetch(url.startsWith("/") ? `${siteUrl}${url}` : url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok || Number(response.headers.get("content-length") ?? 0) > MAX_MEDIA_BYTES) return null;
  return new Uint8Array(await response.arrayBuffer());
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
