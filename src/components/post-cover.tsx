import { COVER_COLS, coverPalette, coverPixels, COVER_ROWS } from "@/lib/post-pixels";
import { cn } from "@/lib/utils";

// A post's cover. Without an image it draws pixels in the theme's accents, like
// the logo: always the same pattern for the same seed (the slug).

const COLORS = coverPalette({ primary: "var(--primary)", accents: [1, 2, 3, 4].map((n) => `var(--accent-${n})`) });

export function PostCover({ src, seed, className }: { src: string | null; seed: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- any size, any host
    return <img src={src} alt="" loading="lazy" className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${COVER_COLS} ${COVER_ROWS}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      className={cn("h-full w-full bg-muted", className)}
    >
      {coverPixels(seed).map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width="1" height="1" style={{ fill: COLORS[p.color] }} opacity={p.opacity} />
      ))}
    </svg>
  );
}
