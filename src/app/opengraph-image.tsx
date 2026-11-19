import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/config";
import { pixelLogoDataUri } from "@/lib/pixel-logo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteConfig.seo.title;

// Files under public/ (logo, photo) as data URIs, so the image renders without a network call.
async function publicFile(path: string, type: string) {
  const data = await readFile(join(process.cwd(), "public", path));
  return `data:${type};base64,${data.toString("base64")}`;
}

const font = (file: string) => readFile(join(process.cwd(), "src/app/og-fonts", file));
const mime = (path: string) => (path.endsWith(".png") ? "image/png" : "image/jpeg");

// Share image built from site.config.ts: logo, name, headline and tagline on the
// dark theme, with the photo on the right and the accent palette as a top bar.
export default async function Image() {
  const { theme, darkTheme, person, hero, seo } = siteConfig;
  const t = darkTheme ?? theme;
  const logoPath = person.logoPixel ? null : person.logoDark || person.logo;
  const photoPath = person.photo.startsWith("/") && !person.photo.endsWith(".svg") ? person.photo : null;
  const [heading, body, logo, photo] = await Promise.all([
    font("PlayfairDisplay-SemiBold.ttf"),
    font("Inter-Regular.ttf"),
    logoPath ? publicFile(logoPath, mime(logoPath)) : null,
    photoPath ? publicFile(photoPath, mime(photoPath)) : null,
  ]);
  const palette = [t.accents[0], t.primary, t.accents[1], t.accents[2], t.accents[3]];
  const headline = [hero.headlineBefore, hero.headlineHighlight, hero.headlineAfter].filter(Boolean).join(" ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: t.background, fontFamily: "Inter" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, padding: "0 64px" }}>
          {person.logoPixel ? (
            <img src={pixelLogoDataUri(person.logoPixel, "dark")} alt="" width={96} height={96} />
          ) : logo ? (
            <img src={logo} alt="" width={84} height={84} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ display: "flex", fontFamily: "Playfair", fontSize: 84, color: t.primary }}>
              {person.initials.charAt(0)}
            </div>
          )}
          <div style={{ display: "flex", marginTop: 36, fontFamily: "Playfair", fontSize: 76, color: t.foreground }}>
            {person.name}
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 32, lineHeight: 1.35, color: t.foreground }}>
            {headline}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 24, color: t.mutedForeground }}>{seo.tagline}</div>
        </div>
        {photo && (
          <div style={{ display: "flex", width: 400, height: "100%", position: "relative" }}>
            <img src={photo} alt="" width={400} height={630} style={{ objectFit: "cover", objectPosition: "50% 30%" }} />
            {/* Fades the photo's left edge into the background. */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 400,
                height: 630,
                display: "flex",
                background: `linear-gradient(90deg, ${t.background}, transparent 35%)`,
              }}
            />
          </div>
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            display: "flex",
            background: `linear-gradient(90deg, ${palette.join(", ")})`,
          }}
        />
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
