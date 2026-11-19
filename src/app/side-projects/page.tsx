import { siteConfig } from "@/lib/config";
import { ProjectsListing } from "@/components/projects-listing";

// Same reason as /projects.
export const dynamic = "force-dynamic";

export const metadata = { title: `Side projects | ${siteConfig.person.name}` };

export default function SideProjectsPage() {
  return <ProjectsListing lead="personal" heading="Side projects" />;
}
