// The pixel pattern drawn for posts without a cover image, on the site and in
// share images: always the same for the same seed (the slug).

export const COLS = 32;
export const ROWS = 18;
const PIXEL_COLORS = 5;

function random(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** The pattern for a seed; `color` is an index into five accent colours. */
export function coverPixels(seed: string) {
  const next = random(seed || "post");
  const tilt = next() * 0.6 + 0.2;
  const flip = next() > 0.5;
  const out: { x: number; y: number; color: number; opacity: number }[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Denser towards one bottom corner, coloured along the diagonal.
      const across = (flip ? COLS - 1 - x : x) / (COLS - 1);
      const down = y / (ROWS - 1);
      const density = across * tilt + down * (1 - tilt);
      const roll = next();
      if (roll > density * density * 1.5) continue;
      const step = Math.min(PIXEL_COLORS - 1, Math.floor(((x + y) / (COLS + ROWS - 2)) * PIXEL_COLORS));
      out.push({ x, y, color: step, opacity: Math.min(1, 0.35 + Math.round(next() * 6) / 10) });
    }
  }
  return out;
}
