import { howFields } from "../fields";
import { HomeGroupForm } from "../home-group";

export default function HowIWorkSettingsPage() {
  return (
    <HomeGroupForm
      title="How I work, systems and credentials"
      description="Shown on the home page, /how-i-work and /about."
      fields={howFields}
    />
  );
}
