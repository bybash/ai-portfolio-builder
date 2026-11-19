import { footerFields } from "../fields";
import { SectionForm } from "../section-form";

export default function FooterSettingsPage() {
  return <SectionForm section="footer" title="Footer" fields={footerFields} />;
}
