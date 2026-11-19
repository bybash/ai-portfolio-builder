import Image from "next/image";
import Link from "next/link";

import { PageEyebrow } from "@/components/page-eyebrow";
import { RichText } from "@/components/rich-text";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { features, siteConfig } from "@/lib/config";

export const metadata = { title: `About me | ${siteConfig.person.name}` };

// The Who page: a short biography, the career in four steps and the
// credentials, with the CV download when that feature is on.
export default function AboutPage() {
  const { about, person, contact, home } = siteConfig;
  const { journey, credentials } = home;

  return (
    <div className="flex flex-1 flex-col text-foreground">
      <SiteHeader active="about" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="grid grid-cols-1 gap-10 py-12 md:grid-cols-[1fr_260px]">
          <div>
            <PageEyebrow word="Who" />
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">About me</h1>
            <p className="mt-3 text-lg text-muted-foreground">{about.intro}</p>
            <div className="mt-8 flex max-w-[65ch] flex-col gap-4 leading-relaxed text-foreground/85">
              {about.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              {features.cv && (
                <Button size="lg" asChild>
                  <a href="/cv">Download CV →</a>
                </Button>
              )}
              {contact.email && (
                <Button size="lg" variant="neutral" asChild>
                  <a href={`mailto:${contact.email}`}>Get in touch</a>
                </Button>
              )}
            </div>
          </div>
          <div className="relative order-first aspect-square w-48 overflow-hidden rounded-xl border border-border shadow-brutal md:order-none md:w-full">
            <Image src={person.photo} alt={person.name} fill sizes="260px" className="object-cover object-[50%_30%]" />
          </div>
        </section>

        {journey.steps.length > 0 && (
          <section className="pb-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-lg border border-border bg-foreground px-3 py-1 text-xs font-semibold tracking-wide text-background uppercase">
                Career
              </span>
              <span className="h-0.5 flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
              {journey.steps.map((step) => (
                <div key={step.period} className="border-t-2 border-border pt-5">
                  <span className="font-heading text-xl font-semibold text-link">{step.period}</span>
                  <p className="mt-2 text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
            <Link
              href="/experience"
              className="mt-6 inline-flex items-center gap-1 text-sm font-normal text-link hover:underline"
            >
              Every role, with dates →
            </Link>
          </section>
        )}

        {credentials.length > 0 && (
          <section className="pb-24">
            <div className="mb-6 flex items-center gap-3">
              <span className="rounded-lg border border-border bg-foreground px-3 py-1 text-xs font-semibold tracking-wide text-background uppercase">
                Certificates and education
              </span>
              <span className="h-0.5 flex-1 bg-border" />
            </div>
            <ul className="divide-y divide-border">
              {credentials.map((c) => (
                <li key={c.title} className="flex gap-4 py-3">
                  <span className="w-10 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">{c.year}</span>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{c.issuer}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
