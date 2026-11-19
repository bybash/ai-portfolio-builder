import { SettingsForm } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

import { footerFields } from "../fields";

export default async function FooterSettingsPage() {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  return (
    <SettingsForm
      key={JSON.stringify(stored.footer ?? null)}
      section="footer"
      title="Footer"
      fields={footerFields}
      initial={site.footer}
      saved={Boolean(stored.footer)}
    />
  );
}
