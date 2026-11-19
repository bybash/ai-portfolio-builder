import { PixelLogo } from "@/components/pixel-logo-mark";
import type { PixelLogoConfig } from "@/lib/pixel-logo";

// What the logo draws, from site.config.ts `person` with the admin's settings
// on top (logoMark() in site-settings.ts). Passed as a prop, because the
// header that shows it is a client component.
export type LogoMark = { pixel: PixelLogoConfig | null; image: string; imageDark: string };

// The logo mark. In order of preference: the pixel-art mark (person.logoPixel),
// the logo image (person.logo, and person.logoDark for the dark theme), or the
// first initial filled with the theme's accent gradient.
export function Logo({ initials, mark, className }: { initials: string; mark: LogoMark; className?: string }) {
  const { pixel: logoPixel, image: logo, imageDark: logoDark } = mark;
  if (logoPixel) return <PixelLogo {...logoPixel} className={className} />;
  if (logo) {
    const img = (src: string, extra: string) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" aria-hidden="true" className={`shrink-0 object-contain ${extra} ${className ?? ""}`} />
    );
    if (!logoDark) return img(logo, "");
    return (
      <>
        {img(logo, "dark:hidden")}
        {img(logoDark, "hidden dark:block")}
      </>
    );
  }

  const stops = ["--accent-1", "--primary", "--accent-2", "--accent-3", "--accent-4"];
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className={`shrink-0 ${className ?? ""}`}>
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0.2" x2="1" y2="0.8">
          {stops.map((v, i) => (
            <stop key={v} offset={i / (stops.length - 1)} style={{ stopColor: `var(${v})` }} />
          ))}
        </linearGradient>
      </defs>
      <text
        x="20"
        y="33"
        textAnchor="middle"
        fill="url(#logo-gradient)"
        style={{ fontFamily: "var(--font-heading)", fontSize: 42, fontWeight: 700 }}
      >
        {initials.charAt(0)}
      </text>
    </svg>
  );
}
