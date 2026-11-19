import Link from "next/link";
import {
  BadgeCheck,
  Handshake,
  IterationCw,
  MessagesSquare,
  PackageOpen,
  Puzzle,
  SearchCheck,
  Sprout,
  Target,
  type LucideIcon,
} from "lucide-react";

import type { siteConfig } from "@/lib/config";

type Trait = (typeof siteConfig)["home"]["traits"][number];

// The `icon` keys a trait in site.config.ts can use.
const TRAIT_ICONS: Record<string, LucideIcon> = {
  "package-open": PackageOpen,
  "search-check": SearchCheck,
  puzzle: Puzzle,
  target: Target,
  iteration: IterationCw,
  sprout: Sprout,
  "badge-check": BadgeCheck,
  handshake: Handshake,
  messages: MessagesSquare,
};

// Icon colours cycle through the theme's accent tints (CSS variables, so they
// follow the light or dark palette). The base --accent is skipped: in dark mode
// it is too close to the card background.
const TRAIT_COLORS = ["--accent-1", "--accent-2", "--accent-3", "--accent-4", "--accent-5"].map(
  (v) => `var(${v})`,
);

function TraitIcon({ name, color }: { name: string | undefined; color: string }) {
  const Icon = (name && TRAIT_ICONS[name]) || Target;
  return (
    <span
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-xl border"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
      }}
    >
      <Icon data-motion="draw" className="size-5" strokeWidth={1.75} />
    </span>
  );
}

// "How I work" on the home page and /how-i-work: one full-width row per trait,
// so longer copy reads on a wide line. The text lines up with the title.
export function TraitRows({ traits }: { traits: Trait[] }) {
  return (
    <div data-reveal-group className="divide-y divide-border rounded-xl border border-border bg-card">
      {traits.map((trait, i) => (
        <div key={trait.title} className="p-6">
          <div className="flex items-center gap-4">
            <TraitIcon name={trait.icon} color={TRAIT_COLORS[i % TRAIT_COLORS.length]} />
            <h3 className="text-xl font-semibold text-foreground">{trait.title}</h3>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:pl-14">
            <p className="text-base text-muted-foreground">{trait.description}</p>
            <p className="text-sm text-muted-foreground">
              Proof:{" "}
              <Link href={trait.proofHref} className="underline underline-offset-4 hover:text-foreground">
                {trait.proofLabel}
              </Link>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
