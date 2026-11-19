import { ExternalLink, User } from "lucide-react";
import Image from "next/image";

import { GithubIcon } from "@/components/github-icon";
import coverSizes from "@/lib/cover-sizes.json";
// Deterministic pick per project (stable across renders/reloads), not
// Math.random(): cycles through the site's secondary accent palette.
const COVER_BACKGROUNDS = ["bg-accent-1/20", "bg-accent-2/30", "bg-accent-3/20", "bg-accent-4/40", "bg-accent-5/40"];

// Two-stop gradients built from the same accent palette, for projects with
// no cover image yet: keeps the "no image" state visually consistent with
// the tinted backgrounds used behind real screenshots.
const NO_IMAGE_GRADIENTS = [
  "bg-gradient-to-br from-accent-1/40 to-accent-4/50",
  "bg-gradient-to-br from-accent-3/40 to-accent-5/50",
  "bg-gradient-to-br from-accent-4/50 to-accent-2/50",
  "bg-gradient-to-br from-accent-2/60 to-accent-1/30",
  "bg-gradient-to-br from-accent-5/50 to-accent-3/40",
];

function pickFor<T>(seed: string, options: T[]) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return options[Math.abs(hash) % options.length];
}

const PLACEHOLDER_PREFIX = "data:image/svg+xml";

// The card's image area is 16:10. A cover close to that shape fills it edge to
// edge; anything else (phone screenshots, square illustrations, very wide
// banners) stays whole inside a padded frame, because filling would crop it.
const CARD_RATIO = 16 / 10;
const SIZES: Record<string, number[]> = coverSizes;

function fillsCard(url: string) {
  const size = SIZES[url];
  if (!size) return false;
  const ratio = size[0] / size[1] / CARD_RATIO;
  return ratio > 0.9 && ratio < 1.12;
}

// A file named like the cover with "-dark" before the extension (cover.png and
// cover-dark.png) replaces it in the dark theme. Only measured files count, so
// a missing dark file never shows a broken image.
function darkVariant(url: string) {
  const dark = url.replace(/(\.\w+)$/, "-dark$1");
  return dark !== url && SIZES[dark] ? dark : null;
}

export function ProjectCoverImage({
  id,
  coverImageUrl,
  title,
  year,
  yearRange,
  years,
  category,
  liveUrl,
  repoUrl,
}: {
  id: string;
  coverImageUrl: string | null;
  title: string;
  year: number | null;
  yearRange?: string | null;
  years?: number[];
  category?: "commercial" | "personal";
  liveUrl?: string | null;
  repoUrl?: string | null;
}) {
  const yearChips = years && years.length > 0 ? years : null;
  const yearLabel = !yearChips ? yearRange || year : null;
  const isPlaceholder = coverImageUrl?.startsWith(PLACEHOLDER_PREFIX) ?? false;
  const fullBleed = !!coverImageUrl && !isPlaceholder && fillsCard(coverImageUrl);
  const darkUrl = fullBleed ? darkVariant(coverImageUrl) : null;

  return (
    <div
      className={`relative flex aspect-16/10 shrink-0 items-center justify-center overflow-hidden border-b border-border ${
        !coverImageUrl
          ? pickFor(id, NO_IMAGE_GRADIENTS)
          : isPlaceholder
            ? ""
            : pickFor(id, COVER_BACKGROUNDS)
      }`}
    >
      {coverImageUrl && isPlaceholder && (
        // Inline SVG data URI: Next's optimizer can't process these, and
        // there's nothing to gain from optimizing a tiny gradient anyway.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImageUrl} alt={title} className="h-full w-full object-cover" />
      )}
      {coverImageUrl && fullBleed && (
        <Image
          src={coverImageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className={`object-cover ${darkUrl ? "dark:hidden" : ""}`}
        />
      )}
      {darkUrl && (
        <Image
          src={darkUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="hidden object-cover dark:block"
        />
      )}
      {coverImageUrl && !isPlaceholder && !fullBleed && (
        <div className="relative h-[82%] w-[90%]">
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain"
          />
        </div>
      )}
      {yearChips && (
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {yearChips.map((y) => (
            <span
              key={y}
              className="rounded-lg border border-border bg-card px-2.5 py-0.5 text-xs font-bold shadow-brutal-sm"
            >
              {y}
            </span>
          ))}
        </span>
      )}
      {yearLabel && (
        <span className="absolute top-3 left-3 rounded-lg border border-border bg-card px-2.5 py-0.5 text-xs font-bold shadow-brutal-sm">
          {yearLabel}
        </span>
      )}
      <span className="absolute top-3 right-3 flex items-center gap-1.5">
        {repoUrl && (
          <span className="group relative flex size-7 items-center justify-center rounded-lg border border-border bg-card shadow-brutal-sm">
            <GithubIcon className="size-3.5" />
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 mt-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold opacity-0 shadow-brutal-sm group-hover:opacity-100"
            >
              Open source
            </span>
          </span>
        )}
        {liveUrl && (
          <span className="group relative flex size-7 items-center justify-center rounded-lg border border-border bg-card shadow-brutal-sm">
            <ExternalLink className="size-3.5" />
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 mt-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold opacity-0 shadow-brutal-sm group-hover:opacity-100"
            >
              Live site
            </span>
          </span>
        )}
        {category === "personal" && (
          <span className="group relative flex size-7 items-center justify-center rounded-lg border border-border bg-card shadow-brutal-sm">
            <User className="size-3.5" />
            <span
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 mt-1.5 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold opacity-0 shadow-brutal-sm group-hover:opacity-100"
            >
              Personal project
            </span>
          </span>
        )}
      </span>
    </div>
  );
}

// The full-width banner at the top of a project's page. With a logo next to
// the cover (logo.svg or logo.png, plus an optional logo-dark version), it is
// that logo, kept small so it stays sharp, on the site's gradient
// (.project-banner in globals.css). Without one, the cover itself, cropped to a
// short strip through its middle. Nothing renders for projects without a real
// cover image. It is decorative (the title follows right after), so the alt
// text is empty.
export function ProjectHeaderImage({ coverImageUrl }: { coverImageUrl: string | null }) {
  if (!coverImageUrl || coverImageUrl.startsWith(PLACEHOLDER_PREFIX)) return null;
  const dir = coverImageUrl.slice(0, coverImageUrl.lastIndexOf("/") + 1);
  const logo = ["logo.svg", "logo.png"].map((f) => dir + f).find((u) => SIZES[u]);

  if (logo) {
    const logoDark = darkVariant(logo);
    // Same visual weight for every logo: wide wordmarks get a little shorter,
    // compact ones a little taller (equal area, within limits).
    const [w, h] = SIZES[logo];
    const scale = Math.min(1.3, Math.max(0.75, Math.sqrt(4 / (w / h))));
    const img = (src: string, extra: string) => (
      // Plain img: SVG logos need no optimising, and PNG logos are already small.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={{ height: `calc(clamp(1.75rem, 4vw, 3.25rem) * ${scale.toFixed(2)})` }}
        className={`max-w-[70%] object-contain ${extra}`}
      />
    );
    return (
      <div data-reveal className="project-banner flex h-[clamp(8rem,18vw,14rem)] w-full items-center justify-center border-b border-border">
        {img(logo, logoDark ? "dark:hidden" : "")}
        {logoDark && img(logoDark, "hidden dark:block")}
      </div>
    );
  }

  const fullBleed = fillsCard(coverImageUrl);
  const darkUrl = fullBleed ? darkVariant(coverImageUrl) : null;
  const sizes = "100vw";
  return (
    <div
      data-reveal
      className={`relative h-[clamp(8rem,18vw,14rem)] w-full overflow-hidden border-b border-border ${
        fullBleed ? "" : "bg-card"
      }`}
    >
      {fullBleed ? (
        <>
          <Image
            src={coverImageUrl}
            alt=""
            fill
            priority
            sizes={sizes}
            className={`object-cover object-center ${darkUrl ? "dark:hidden" : ""}`}
          />
          {darkUrl && (
            <Image src={darkUrl} alt="" fill priority sizes={sizes} className="hidden object-cover object-center dark:block" />
          )}
        </>
      ) : (
        <Image src={coverImageUrl} alt="" fill priority sizes={sizes} className="object-contain p-6" />
      )}
    </div>
  );
}
