import { SettingsForm } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

import { aboutFields } from "../fields";

export default async function AboutSettingsPage() {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  return (
    <SettingsForm
      key={JSON.stringify(stored.about ?? null)}
      section="about"
      title="About page"
      description="The biography on /about. The journey and credentials there come from the Home and How I work settings."
      fields={aboutFields}
      initial={site.about}
      saved={Boolean(stored.about)}
    />
  );
}
