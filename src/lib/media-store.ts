import { MAX_MEDIA_BYTES, MEDIA_EXTENSIONS, sniffImageType } from "@/lib/media";
import { prisma } from "@/lib/prisma";

/** Stores an image and returns its path, or null when it is not a usable image. */
export async function storeImage(data: Uint8Array<ArrayBuffer>): Promise<string | null> {
  const type = sniffImageType(data);
  if (!type || data.byteLength > MAX_MEDIA_BYTES) return null;
  const media = await prisma.media.create({ data: { type, data }, select: { id: true } });
  return `/media/${media.id}.${MEDIA_EXTENSIONS[type]}`;
}

/** Reads a stored image by its path, or null. */
export async function readStoredImage(path: string) {
  const match = path.match(/^\/media\/([\w-]+)\.(\w+)$/);
  if (!match) return null;
  const media = await prisma.media.findUnique({ where: { id: match[1] } });
  return media && MEDIA_EXTENSIONS[media.type as keyof typeof MEDIA_EXTENSIONS] === match[2] ? media : null;
}
