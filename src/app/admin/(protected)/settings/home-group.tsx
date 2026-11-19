import { SettingsForm, type FieldSpec } from "@/components/admin/settings-form";
import { getSite, readSettings } from "@/lib/site-settings";

// A form for some of the keys in `home`. Each key saves and resets on its own,
// so the groups on different pages do not overwrite each other.
export async function HomeGroupForm({ title, description, fields }: { title: string; description?: string; fields: FieldSpec[] }) {
  const [site, stored] = await Promise.all([getSite(), readSettings()]);
  const keys = fields.map((f) => f.key) as (keyof typeof site.home)[];
  const initial = Object.fromEntries(keys.map((k) => [k, site.home[k]]));
  const storedKeys = keys.filter((k) => stored.home && k in stored.home);
  return (
    <SettingsForm
      key={JSON.stringify(storedKeys.map((k) => stored.home?.[k as keyof typeof stored.home]))}
      section="home"
      title={title}
      description={description}
      fields={fields}
      initial={initial}
      saved={storedKeys.length > 0}
      resetKeys={keys}
    />
  );
}
