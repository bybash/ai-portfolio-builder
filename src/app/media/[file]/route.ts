import { MEDIA_EXTENSIONS } from "@/lib/media";
import { prisma } from "@/lib/prisma";

// Images uploaded in /admin. An image never changes once stored, so browsers
// and the CDN keep it for a year. Ids are random, so drafts' images can't be guessed.
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const [id, extension] = (await params).file.split(".");
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || MEDIA_EXTENSIONS[media.type] !== extension) {
    return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  return new Response(new Uint8Array(media.data), {
    headers: {
      "content-type": media.type,
      "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
