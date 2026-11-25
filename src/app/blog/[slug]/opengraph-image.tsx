import { readFile } from "fs/promises";
import { join } from "path";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

import { siteUrl } from "@/lib/config";
import { pixelLogoDataUri } from "@/lib/pixel-logo";
import { coverDataUri } from "@/lib/post-cover-data";
import { COVER_COLS, coverPalette, coverPixels, COVER_ROWS } from "@/lib/post-pixels";
import { publishedPost } from "@/lib/posts";
import { getSite } from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COVER_WIDTH = 480;

const font = (file: string) => readFile(join(process.cwd(), "src/app/og-fonts", file));

// A post's share image: its title over the dark theme, with the cover (or the
// same pixel pattern the blog shows) on the right.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = await publishedPost((await params).slug);
  if (!post) notFound();
  const { person, theme, darkTheme } = await getSite();
  const t = darkTheme ?? theme;
  const [heading, body, photo] = await Promise.all([
    font("PlayfairDisplay-SemiBold.ttf"),
    font("Inter-Regular.ttf"),
    coverDataUri(post.coverImageUrl),
  ]);
  const palette = coverPalette(t);
  // The panel is taller than the pattern's shape, so it shows the slice with
  // whichever bottom corner is denser.
  const all = coverPixels(post.slug);
  const cell = size.height / COVER_ROWS;
  const shown = Math.ceil(COVER_WIDTH / cell);
  const left = all.filter((p) => p.x < shown).length;
  const right = all.filter((p) => p.x >= COVER_COLS - shown).length;
  const offset = right > left ? COVER_COLS - shown : 0;
  const rects = all
    .filter((p) => p.x >= offset && p.x < offset + shown)
    .map((p) => `<rect x="${p.x - offset}" y="${p.y}" width="1" height="1" fill="${palette[p.color]}" opacity="${p.opacity}"/>`)
    .join("");
  const pattern = `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${COVER_WIDTH}" height="${size.height}" viewBox="0 0 ${COVER_WIDTH / cell} ${COVER_ROWS}" shape-rendering="crispEdges">${rects}</svg>`,
  ).toString("base64")}`;
  const length = post.title.length;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: t.background, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "72px 48px 56px 64px" }}>
          <div style={{ display: "flex", fontFamily: "Playfair", fontSize: length > 100 ? 42 : length > 60 ? 52 : 64, lineHeight: 1.15, color: t.foreground }}>
            {post.title}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {person.logoPixel && <img src={pixelLogoDataUri(person.logoPixel, "dark")} alt="" width={64} height={64} style={{ marginRight: 20 }} />}
            <div style={{ display: "flex", flexDirection: "column", fontSize: 26 }}>
              <span style={{ color: t.foreground }}>{person.name}</span>
              <span style={{ color: t.mutedForeground, fontSize: 22 }}>{`${new URL(siteUrl).host}/blog`}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", width: COVER_WIDTH, height: size.height }}>
          <img src={photo ?? pattern} alt="" width={COVER_WIDTH} height={size.height} style={{ objectFit: "cover" }} />
          {photo && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: COVER_WIDTH,
                height: size.height,
                display: "flex",
                background: `linear-gradient(90deg, ${t.background}, transparent 30%)`,
              }}
            />
          )}
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, display: "flex", background: `linear-gradient(90deg, ${palette.join(", ")})` }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Playfair", data: heading, weight: 600, style: "normal" },
        { name: "Inter", data: body, weight: 400, style: "normal" },
      ],
    },
  );
}
