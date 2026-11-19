import { revalidatePath } from "next/cache";
import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import type { SiteConfig } from "@site-config";

import type { LogoMark } from "@/components/logo";
import { resolveFeatures, siteConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { parseSettings, settingsSchemas, type SettingsSection, type SiteSettings } from "@/lib/site-settings-schema";

// The settings saved in /admin/settings, read once per request. Without a
// database, or when it cannot be reached, the site uses site.config.ts alone,
// so `next build` and a site without a database still work.
export const readSettings = cache(async (): Promise<SiteSettings> => {
  if (!process.env.DATABASE_URL) return {};
  try {
    const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
    return parseSettings(row?.data);
  } catch (err) {
    console.error("Could not read site settings; using site.config.ts.", err);
    return {};
  }
});

// site.config.ts with the saved settings on top. Pages and routes that show
// a setting the admin can change read it from here, not from siteConfig.
export const getSite = cache(async (): Promise<SiteConfig> => {
  const s = await readSettings();
  return {
    ...siteConfig,
    hero: s.hero ? { ...siteConfig.hero, ...s.hero } : siteConfig.hero,
    home: { ...siteConfig.home, ...s.home },
    about: s.about ?? siteConfig.about,
    footer: s.footer ?? siteConfig.footer,
    person: {
      ...siteConfig.person,
      ...(s.session && { session: s.session }),
      ...(s.logoPixel !== undefined && { logoPixel: s.logoPixel }),
    },
  };
});

// The logo props for <Logo>, from the merged settings.
export function logoMark(site: SiteConfig): LogoMark {
  return { pixel: site.person.logoPixel, image: site.person.logo, imageDark: site.person.logoDark };
}

// The feature flags: the file, then the admin's settings, then FEATURE_* env
// vars, then the AI checks (see resolveFeatures in config.ts).
export const getFeatures = cache(async () => {
  const s = await readSettings();
  return resolveFeatures({ ...siteConfig.features, ...s.features });
});

// "log, item 4, verb: is empty." from a zod issue, for the admin form.
function describeIssue(issue: { path: PropertyKey[]; code: string; message: string }) {
  const where = issue.path.map((p) => (typeof p === "number" ? `item ${p + 1}` : String(p))).join(", ");
  const what = issue.code === "too_small" ? "is empty." : issue.message;
  return where ? `${where}: ${what}` : what;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

// Saves one section (or with `value` undefined, removes it so the file's
// values apply again). Callers check the admin session first.
export async function saveSettingsSection(section: SettingsSection, value: unknown): Promise<SaveResult> {
  let next: unknown;
  if (value !== undefined) {
    const parsed = settingsSchemas[section].safeParse(value);
    if (!parsed.success) {
      return { ok: false, error: describeIssue(parsed.error.issues[0]) };
    }
    next = parsed.data;
  }

  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const data = { ...((row?.data as Record<string, unknown> | null) ?? {}) };
  if (next === undefined) delete data[section];
  else data[section] = next;
  const json = data as Prisma.InputJsonValue;
  await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, data: json }, update: { data: json } });

  await refreshPublicPages();
  return { ok: true };
}

// After a save: drop Next.js's cached pages, and on Netlify purge the CDN,
// which otherwise keeps public pages for up to 5 minutes (next.config.ts).
export async function refreshPublicPages() {
  revalidatePath("/", "layout");
  await purgeCdn();
}

// Purges Netlify's CDN cache for the whole site. It runs only when
// NETLIFY_PURGE_API_TOKEN and SITE_ID are set (Netlify provides both to the
// site's functions); elsewhere it does nothing.
export async function purgeCdn() {
  const token = process.env.NETLIFY_PURGE_API_TOKEN;
  const siteId = process.env.SITE_ID;
  if (!token || !siteId) return;
  try {
    const res = await fetch("https://api.netlify.com/api/v1/purge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: siteId }),
    });
    if (!res.ok) console.error(`Netlify cache purge failed: ${res.status} ${await res.text()}`);
  } catch (err) {
    console.error("Netlify cache purge failed.", err);
  }
}
