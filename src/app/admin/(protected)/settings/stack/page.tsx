import { stackFields } from "../fields";
import { HomeGroupForm } from "../home-group";

export default function StackSettingsPage() {
  return <HomeGroupForm title="Stack" description="The stack chips on the home page." fields={stackFields} />;
}
