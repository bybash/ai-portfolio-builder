import { SettingsForm } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

import { heroFields } from "../fields";

export default async function HeroSettingsPage() {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  return (
    <SettingsForm
      key={JSON.stringify(stored.hero ?? null)}
      section="hero"
      title="Hero"
      description="The top of the home page, which streams in like an AI chat answer."
      fields={heroFields}
      initial={site.hero}
      saved={Boolean(stored.hero)}
    />
  );
}
