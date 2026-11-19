import { ImageResponse } from "next/og";

import { pixelLogoDataUri } from "@/lib/pixel-logo";
import { getSite } from "@/lib/site-settings";

// Read per request, so a logo saved in /admin/settings shows straight away and
// `next build` never needs a database.
export const dynamic = "force-dynamic";

// The favicon and app icon, drawn from the logo in site.config.ts: the pixel
// mark when person.logoPixel is set, otherwise the first initial on the
// primary colour. 32 px for browser tabs, 192 px for Android and search results.
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const px = Number(await id);
  const { person, theme } = await getSite();
  return new ImageResponse(
    person.logoPixel ? (
      <img src={pixelLogoDataUri(person.logoPixel, "dark")} alt="" width={px} height={px} />
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: px / 5,
          background: theme.primary,
          color: "#fff",
          fontSize: px * 0.7,
          fontWeight: 700,
        }}
      >
        {person.initials.charAt(0)}
      </div>
    ),
    { width: px, height: px },
  );
}
