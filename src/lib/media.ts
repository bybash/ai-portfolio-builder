// Images uploaded in /admin, stored in the database and served from /media.
// The browser shrinks photos first (src/components/admin/upload-image.ts).

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

export const MEDIA_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
} as const;

export type ImageType = keyof typeof MEDIA_EXTENSIONS;

// The real type from the file's first bytes, whatever the upload claims. No
// SVG: it can carry scripts.
export function sniffImageType(b: Uint8Array): ImageType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}
