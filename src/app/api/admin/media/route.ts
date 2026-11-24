// Image upload for the post editor. The /admin proxy does not cover /api, so
// this checks the admin session itself.
import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { features } from "@/lib/config";
import { MAX_MEDIA_BYTES, MEDIA_EXTENSIONS, sniffImageType } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Reads the body with a hard cap, whatever Content-Length says.
async function readCapped(request: Request) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!request.body) return new Uint8Array();
  for await (const chunk of request.body as unknown as AsyncIterable<Uint8Array>) {
    size += chunk.byteLength;
    if (size > MAX_MEDIA_BYTES) return null;
    chunks.push(chunk);
  }
  return new Uint8Array(Buffer.concat(chunks));
}

export async function POST(request: Request) {
  if (!features.admin || !(await isAuthenticated())) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const data = await readCapped(request);
  if (!data) return NextResponse.json({ error: "The image is over 4 MB." }, { status: 413 });
  const type = sniffImageType(data);
  if (!type) return NextResponse.json({ error: "Use a JPEG, PNG, GIF or WebP image." }, { status: 415 });
  const media = await prisma.media.create({ data: { type, data }, select: { id: true } });
  return NextResponse.json({ url: `/media/${media.id}.${MEDIA_EXTENSIONS[type]}` });
}
