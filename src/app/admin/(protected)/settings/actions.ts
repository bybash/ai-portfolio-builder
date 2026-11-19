"use server";

import { requireAdmin } from "@/lib/auth";
import { readSettings, saveSettingsSection, type SaveResult } from "@/lib/site-settings";
import type { SettingsSection } from "@/lib/site-settings-schema";

// `home` holds several groups edited on different pages (stats, traits, the
// stack, ...), so its saves and resets touch only the keys they are given.

export async function saveSettings(section: SettingsSection, value: unknown): Promise<SaveResult> {
  await requireAdmin();
  if (section === "home" && value && typeof value === "object") {
    const stored = (await readSettings()).home ?? {};
    return saveSettingsSection("home", { ...stored, ...value });
  }
  return saveSettingsSection(section, value);
}

// Removes saved values so site.config.ts applies again: the whole section, or
// for `home`, only `keys`.
export async function resetSettings(section: SettingsSection, keys?: string[]): Promise<SaveResult> {
  await requireAdmin();
  if (section === "home" && keys?.length) {
    const rest: Record<string, unknown> = { ...(await readSettings()).home };
    for (const key of keys) delete rest[key];
    return saveSettingsSection("home", Object.keys(rest).length ? rest : undefined);
  }
  return saveSettingsSection(section, undefined);
}
