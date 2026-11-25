// Image upload for the post editor. The /admin proxy does not cover /api, so
// this checks the admin session itself.
import { NextResponse } from "next/server";

import { isAuthenticated } from "@/lib/auth";
import { features } from "@/lib/config";
import { MAX_MEDIA_BYTES } from "@/lib/media";
import { storeImage } from "@/lib/media-store";
import { readCapped } from "@/lib/read-capped";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!features.admin || !(await isAuthenticated())) return NextResponse.json({ error: "Log in again." }, { status: 401 });
  const data = await readCapped(request.body, MAX_MEDIA_BYTES);
  if (!data) return NextResponse.json({ error: "The image is over 4 MB." }, { status: 413 });
  const url = await storeImage(data);
  if (!url) return NextResponse.json({ error: "Use a JPEG, PNG, GIF or WebP image." }, { status: 415 });
  return NextResponse.json({ url });
}
