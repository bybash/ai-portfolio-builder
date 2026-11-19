import { PixelLogoEditor } from "@/components/admin/pixel-logo-editor";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

import { sessionFields } from "../fields";

export default async function LogoSettingsPage() {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  return (
    <>
      <PixelLogoEditor
        key={JSON.stringify(stored.logoPixel === undefined ? "file" : stored.logoPixel)}
        initial={site.person.logoPixel}
        saved={stored.logoPixel !== undefined}
      />
      <SettingsForm
        key={JSON.stringify(stored.session ?? null)}
        section="session"
        title="Session block"
        description="The terminal-style lines beside the logo in the header: name and version, the role, and a working directory that follows the page."
        fields={sessionFields}
        initial={site.person.session}
        saved={Boolean(stored.session)}
      />
    </>
  );
}
