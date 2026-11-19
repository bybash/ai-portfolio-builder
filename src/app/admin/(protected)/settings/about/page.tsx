import { aboutFields } from "../fields";
import { SectionForm } from "../section-form";

export default function AboutSettingsPage() {
  return (
    <SectionForm
      section="about"
      title="About page"
      description="The biography on /about. The journey and credentials there come from the Home and How I work settings."
      fields={aboutFields}
    />
  );
}
