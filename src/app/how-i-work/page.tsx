import { PageEyebrow } from "@/components/page-eyebrow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TraitRows } from "@/components/trait-rows";
import { siteConfig } from "@/lib/config";
import { getSite } from "@/lib/site-settings";

export const metadata = { title: `How I work | ${siteConfig.person.name}` };

// Read per request, so settings saved in /admin show straight away and
// `next build` never needs a database.
export const dynamic = "force-dynamic";

// Every "How I work" card; the home page shows the first few.
export default async function HowIWorkPage() {
  const { home } = await getSite();
  return (
    <div className="flex flex-1 flex-col text-foreground">
      <SiteHeader active="how" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-12">
          <PageEyebrow word="How" />
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">How I work</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            The habits behind the work, each with the case study that proves it.
          </p>
        </section>

        <section className="pb-24">
          <TraitRows traits={home.traits} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
