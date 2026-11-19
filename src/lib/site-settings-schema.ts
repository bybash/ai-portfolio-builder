import { z } from "zod";

// The parts of site.config.ts that /admin/settings can change. Each section is
// stored as one JSON value in the SiteSettings row and replaces the same keys
// from the file; a section that was never saved keeps the file's values.
// No server imports here: the admin forms use these schemas too.

const text = z.string().trim();
const textList = z.array(text.min(1));
const proof = { proofLabel: text, proofHref: text };

export const heroSchema = z.object({
  badge: text,
  extraBadges: textList,
  headlineBefore: text,
  headlineHighlight: text,
  headlineAfter: text,
  paragraphs: textList,
  log: z.array(z.object({ verb: text.min(1), text: text.min(1) })),
  running: z.object({ label: text.min(1), short: text, href: text }).nullable(),
  followUps: z.array(z.object({ label: text.min(1), href: text.min(1) })),
});

export const homeSchema = z.object({
  stats: z.array(z.object({ value: text.min(1), description: text, href: text })),
  fits: z.object({
    lead: text,
    items: z.array(z.object({ from: text, title: text.min(1), description: text, ...proof })),
  }),
  journey: z.object({
    heading: text,
    steps: z.array(z.object({ period: text.min(1), description: text })),
  }),
  traits: z.array(z.object({ title: text.min(1), icon: text, description: text, ...proof })),
  systems: z.array(z.object({ title: text.min(1), description: text, ...proof })),
  credentials: z.array(z.object({ year: text, title: text.min(1), issuer: text })),
  stackOrder: textList,
  stackHide: textList,
});

export const aboutSchema = z.object({ intro: text, paragraphs: textList });

export const sessionSchema = z.object({ version: text, versionTitle: text, subtitle: text, home: text });

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, "Colours must be #rrggbb.");

export const logoPixelSchema = z
  .object({
    rows: z
      .array(z.string().regex(/^[#.]+$/, "Rows use # for a pixel and . for empty."))
      .min(1)
      .max(32),
    colors: z.array(hexColor).min(1).max(12),
    depth: z.number().int().min(0).max(6),
  })
  .nullable();

export const footerSchema = z.object({ builtWith: text });

// Flags that are safe to switch from the admin. `admin` and `rateLimit` stay in
// the file and env, so a wrong click cannot lock the owner out or remove the
// limits. Env vars (FEATURE_*) still win over these.
export const EDITABLE_FEATURES = ["chat", "fitCheck", "parseJd", "mcp", "cv", "easterEggs"] as const;
export type EditableFeature = (typeof EDITABLE_FEATURES)[number];
export const featuresSchema = z.object(
  Object.fromEntries(EDITABLE_FEATURES.map((k) => [k, z.boolean()])) as Record<EditableFeature, z.ZodBoolean>,
);

export const settingsSchemas = {
  hero: heroSchema,
  home: homeSchema.partial(),
  about: aboutSchema,
  session: sessionSchema,
  logoPixel: logoPixelSchema,
  footer: footerSchema,
  features: featuresSchema.partial(),
};

export type SettingsSection = keyof typeof settingsSchemas;
export type SiteSettings = { [K in SettingsSection]?: z.infer<(typeof settingsSchemas)[K]> };

// Reads the stored JSON section by section, so one bad section (for example
// after a schema change) falls back to the file without hiding the others.
export function parseSettings(data: unknown): SiteSettings {
  if (!data || typeof data !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(settingsSchemas)) {
    if (!(key in data)) continue;
    const parsed = schema.safeParse((data as Record<string, unknown>)[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  return out as SiteSettings;
}
