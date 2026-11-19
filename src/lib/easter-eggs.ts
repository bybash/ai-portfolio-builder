import { fillPlaceholders, siteConfig } from "@/lib/config";
import { getFeatures } from "@/lib/site-settings";

// Canned answers checked before the AI is called (site.config.ts `easterEggs`).
// Off by default. Keep them harmless: the patterns are public in your repo.
const eggs = siteConfig.easterEggs.map((egg) => ({
  pattern: new RegExp(egg.pattern, "i"),
  answer: egg.answer,
}));

export async function checkEasterEgg(question: string): Promise<string | null> {
  if (!(await getFeatures()).easterEggs) return null;
  const hit = eggs.find((egg) => egg.pattern.test(question));
  return hit ? fillPlaceholders(hit.answer) : null;
}
