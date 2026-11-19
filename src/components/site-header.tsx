import { SiteHeaderNav, type SiteHeaderProps } from "@/components/site-header-nav";
import { siteConfig, socialLinks } from "@/lib/config";
import { getFeatures, getSite, logoMark } from "@/lib/site-settings";

// Server wrapper: feature flags and settings are resolved on the server (env
// overrides and the admin's settings are not visible in the browser), then
// handed to the interactive nav.
export async function SiteHeader(props: SiteHeaderProps) {
  const [site, features] = await Promise.all([getSite(), getFeatures()]);
  return (
    <SiteHeaderNav
      {...props}
      name={site.person.name}
      initials={site.person.initials}
      mark={logoMark(site)}
      session={site.person.session}
      showCv={features.cv}
      showThemeToggle={siteConfig.darkTheme !== null}
      socials={socialLinks.filter((l) => l.label !== "X")}
    />
  );
}
