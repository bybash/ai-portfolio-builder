import { siteConfig } from "@/lib/config";
import { mix } from "@/lib/pixel-logo";

// The logo mark. In order of preference: the pixel-art mark from site.config.ts
// (person.logoPixel), the logo image (person.logo, and person.logoDark for the
// dark theme), or the first initial filled with the theme's accent gradient.
export function Logo({ initials, className }: { initials: string; className?: string }) {
  const { logo, logoDark, logoPixel } = siteConfig.person;
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

// A grid of square pixels, coloured in diagonal steps, drawn with crisp edges
// so it stays blocky at any size. With `depth`, each pixel casts a block down
// and to the right, one layer per pixel of depth, so the mark looks extruded.
// The layers are darker in the dark theme and softer in the light one. On page
// load (and on hover in the header) the layers slide out from behind the face;
// see [data-pixel-logo] in globals.css.
function PixelLogo({
  rows,
  colors,
  depth = 0,
  className,
}: {
  rows: string[];
  colors: string[];
  depth?: number;
  className?: string;
}) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const on = (x: number, y: number) => rows[y]?.[x] === "#";
  const steps = Math.max(width + height - 2, 1);
  const colorAt = (x: number, y: number) => colors[Math.round(((x + y) / steps) * (colors.length - 1))];
  const face = (x: number, y: number) => `${x}-${y}`;
  // Farthest layer first, so nearer layers paint over it.
  const layers = Array.from({ length: depth }, (_, i) => depth - i).map((k) => {
    const pixels: { x: number; y: number; dark: string; light: string }[] = [];
    for (let y = k; y < height + k; y++) {
      for (let x = k; x < width + k; x++) {
        if (!on(x - k, y - k) || on(x, y)) continue;
        const base = colorAt(x - k, y - k);
        pixels.push({ x, y, dark: mix(base, [5, 7, 15], 0.4 + 0.12 * k), light: mix(base, [255, 255, 255], 0.2 + 0.12 * k) });
      }
    }
    return { k, pixels };
  });
  const size = Math.max(width, height) + depth;
  return (
    <svg
      aria-hidden="true"
      data-pixel-logo=""
      viewBox={`${(width + depth - size) / 2 - 0.5} ${(height + depth - size) / 2 - 0.5} ${size + 1} ${size + 1}`}
      shapeRendering="crispEdges"
      className={`shrink-0 ${className ?? ""}`}
    >
      {layers.map(({ k, pixels }) => (
        <g key={k} data-layer="" style={{ "--k": k } as React.CSSProperties}>
          {pixels.map((p) => (
            <rect
              key={face(p.x, p.y)}
              x={p.x}
              y={p.y}
              width={1.02}
              height={1.02}
              style={{ "--light": p.light, "--dark": p.dark } as React.CSSProperties}
              className="fill-(--light) dark:fill-(--dark)"
            />
          ))}
        </g>
      ))}
      <g>
        {rows.flatMap((row, y) =>
          [...row].map((cell, x) =>
            cell === "#" ? <rect key={face(x, y)} x={x} y={y} width={1.02} height={1.02} fill={colorAt(x, y)} /> : null,
          ),
        )}
      </g>
    </svg>
  );
}
