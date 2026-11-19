import { SettingsForm, type FieldSpec } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

type WholeSection = "hero" | "about" | "footer";

// A form for a section that is saved and reset as a whole.
export async function SectionForm({
  section,
  title,
  description,
  fields,
}: {
  section: WholeSection;
  title: string;
  description?: string;
  fields: FieldSpec[];
}) {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  return (
    <SettingsForm
      key={JSON.stringify(stored[section] ?? null)}
      section={section}
      title={title}
      description={description}
      fields={fields}
      initial={site[section]}
      saved={Boolean(stored[section])}
    />
  );
}
