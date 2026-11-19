import { heroFields } from "../fields";
import { SectionForm } from "../section-form";

export default function HeroSettingsPage() {
  return (
    <SectionForm
      section="hero"
      title="Hero"
      description="The top of the home page, which streams in like an AI chat answer."
      fields={heroFields}
    />
  );
}
