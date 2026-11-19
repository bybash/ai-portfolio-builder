import { SiteHeaderNav, type SiteHeaderProps } from "@/components/site-header-nav";
import { features, siteConfig, socialLinks } from "@/lib/config";

// Server wrapper: feature flags are resolved on the server (env overrides are
// not visible in the browser), then handed to the interactive nav.
export function SiteHeader(props: SiteHeaderProps) {
  return (
    <SiteHeaderNav
      {...props}
      name={siteConfig.person.name}
      initials={siteConfig.person.initials}
      session={siteConfig.person.session}
      showCv={features.cv}
      showThemeToggle={siteConfig.darkTheme !== null}
      socials={socialLinks.filter((l) => l.label !== "X")}
    />
  );
}
