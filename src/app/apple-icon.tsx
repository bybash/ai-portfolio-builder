import { ImageResponse } from "next/og";

import { pixelLogoDataUri } from "@/lib/pixel-logo";
import { getSite } from "@/lib/site-settings";

// Read per request, so a logo saved in /admin/settings shows straight away and
// `next build` never needs a database.
export const dynamic = "force-dynamic";

// The home-screen icon on iPhones and iPads. iOS ignores transparency, so the
// mark sits on the theme's background with some padding.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const { person, theme } = await getSite();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.background,
          color: theme.primary,
          fontSize: 120,
          fontWeight: 700,
        }}
      >
        {person.logoPixel ? (
          <img src={pixelLogoDataUri(person.logoPixel, "light")} alt="" width={132} height={132} />
        ) : (
          person.initials.charAt(0)
        )}
      </div>
    ),
    size,
  );
}
