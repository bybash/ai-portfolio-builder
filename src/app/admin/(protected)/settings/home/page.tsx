import { homeFields } from "../fields";
import { HomeGroupForm } from "../home-group";

export default function HomeSettingsPage() {
  return <HomeGroupForm title="Home sections" description="Impact stats, why the journey matters, and the journey." fields={homeFields} />;
}
