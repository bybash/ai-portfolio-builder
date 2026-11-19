// The pixel-art logo (person.logoPixel in site.config.ts) as a standalone SVG
// string, for images rendered on the server: the favicon, the app icons and the
// share image. The header draws the same mark as React (components/logo.tsx),
// with its extrusion layers animated.

export type PixelLogoConfig = { rows: string[]; colors: string[]; depth?: number };

// Mixes a #rrggbb colour toward an [r, g, b] colour by `amount` (0 to 1).
export function mix(hex: string, to: number[], amount: number) {
  return `#${[1, 3, 5]
    .map((i, c) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + to[c] * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

// `shade` picks the extrusion colours: "dark" for dark backgrounds (and small
// sizes, where the deeper shadow reads better), "light" for light ones.
export function pixelLogoSvg({ rows, colors, depth = 0 }: PixelLogoConfig, shade: "light" | "dark") {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const on = (x: number, y: number) => rows[y]?.[x] === "#";
  const steps = Math.max(width + height - 2, 1);
  const colorAt = (x: number, y: number) => colors[Math.round(((x + y) / steps) * (colors.length - 1))];
  const rect = (x: number, y: number, fill: string) => `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${fill}"/>`;

  const parts: string[] = [];
  // Farthest layer first, so nearer layers paint over it.
  for (let k = depth; k >= 1; k--) {
    for (let y = k; y < height + k; y++) {
      for (let x = k; x < width + k; x++) {
        if (!on(x - k, y - k) || on(x, y)) continue;
        const base = colorAt(x - k, y - k);
        parts.push(rect(x, y, shade === "dark" ? mix(base, [5, 7, 15], 0.4 + 0.12 * k) : mix(base, [255, 255, 255], 0.2 + 0.12 * k)));
      }
    }
  }
  rows.forEach((row, y) => [...row].forEach((cell, x) => cell === "#" && parts.push(rect(x, y, colorAt(x, y)))));

  // A square canvas with the mark (and its extrusion) centred.
  const size = Math.max(width, height) + depth;
  const viewBox = `${(width + depth - size) / 2} ${(height + depth - size) / 2} ${size} ${size}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" shape-rendering="crispEdges">${parts.join("")}</svg>`;
}

export function pixelLogoDataUri(logo: PixelLogoConfig, shade: "light" | "dark") {
  return `data:image/svg+xml;base64,${Buffer.from(pixelLogoSvg(logo, shade)).toString("base64")}`;
}
