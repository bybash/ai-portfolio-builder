import Image from "next/image";
import Link from "next/link";
import { CornerDownRight } from "lucide-react";

import { CollapsibleTagRow } from "@/components/collapsible-tag-row";
import { AiPanel } from "@/components/ai-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaqChat } from "@/components/faq-chat";
import { ProjectCoverImage } from "@/components/project-cover-image";
import { RichText } from "@/components/rich-text";
import { SiteFooter } from "@/components/site-footer";
import { SectionLabel } from "@/components/section-label";
import { SiteHeader } from "@/components/site-header";
import { TraitRows } from "@/components/trait-rows";
import { features, siteConfig, siteUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";

// Rendered per request, so `next build` never needs a database and content
// written by the scripts or the admin shows up straight away.
export const dynamic = "force-dynamic";

// The home page shows this many "How I work" cards; /how-i-work shows them all.
const HOME_TRAITS = 4;

export default async function Home() {
  const [projects, personalProjects, stackTags, faqs] = await Promise.all([
    prisma.project.findMany({
      where: { featured: true, category: "commercial" },
      orderBy: { order: "asc" },
      include: { tags: true },
      take: 8,
    }),
    prisma.project.findMany({
      where: { featured: true, category: "personal" },
      orderBy: { order: "asc" },
      include: { tags: true },
      take: 8,
    }),
    prisma.tag.findMany({
      where: { kind: "technology" },
      orderBy: [{ projects: { _count: "desc" } }, { name: "asc" }],
    }),
    prisma.faq.findMany({ orderBy: { order: "asc" } }),
  ]);

  const { hero, home, person, contact } = siteConfig;
  const { stats, fits, journey, traits, systems, credentials, stackOrder, stackHide } = home;
  // Stack chips: the names in stackOrder first, then the other project tags by use,
  // minus the ones in stackHide.
  const stackNames = [...new Set([...stackOrder, ...stackTags.map((t) => t.name)])].filter(
    (name) => !(stackHide as string[]).includes(name),
  );
  const showAi = features.chat || features.fitCheck || features.mcp;

  return (
    <div className="flex flex-1 flex-col text-foreground">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="grid grid-cols-1 gap-8 py-16 md:grid-cols-[1fr_320px] md:gap-x-10 md:py-20">
          <div className="relative w-full justify-self-center text-center md:justify-self-start md:text-left">
            {/* The "thinking" status the hero shows before its text streams in (motion.tsx). */}
            <p
              data-motion="hero-thinking"
              aria-hidden
              className="absolute -top-9 left-1/2 hidden -translate-x-1/2 items-center gap-2 whitespace-nowrap font-sans text-sm text-muted-foreground md:left-0 md:translate-x-0"
            />
            {(hero.badge || hero.extraBadges.length > 0) && (
              <div data-motion="hero-item" className="mb-6 flex flex-wrap justify-center gap-2 md:justify-start">
                <Badge className="bg-secondary px-4 py-1.5 text-sm text-secondary-foreground">
                  {hero.badge}
                </Badge>
                {hero.extraBadges.map((b) => (
                  <Badge key={b} className="border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                    {b}
                  </Badge>
                ))}
              </div>
            )}
            <h1 data-motion="hero-title" className="mx-auto max-w-xl text-4xl leading-[1.04] sm:text-5xl sm:leading-[1.02] font-semibold tracking-tight text-balance md:mx-0 md:max-w-none md:text-6xl">
              {hero.headlineBefore}{" "}
              <span data-motion="hero-highlight" className="inline-block rounded-md px-2 text-accent-foreground">
                {hero.headlineHighlight}
              </span>{" "}
              {hero.headlineAfter}
            </h1>
            <div data-motion="hero-stream" className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-lg text-muted-foreground md:mx-0 md:max-w-none">
              {hero.paragraphs.map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
            {hero.log.length > 0 && (
              <ul data-motion="hero-log" className="mx-auto mt-5 flex max-w-md flex-col gap-1.5 text-left text-sm md:mx-0 md:max-w-none">
                {hero.log.map((line) => (
                  <li key={line.verb} className="flex gap-2">
                    <span aria-hidden className="text-muted-foreground/60">⎿</span>
                    <span>
                      <span className="font-medium text-foreground">{line.verb}</span>{" "}
                      <span className="text-muted-foreground">
                        {line.text.split(/\{(\d+)\}/).map((part, i) =>
                          i % 2 === 1 ? (
                            <span key={i} data-count={part} className="font-medium text-foreground tabular-nums">
                              {Number(part).toLocaleString("en-GB")}
                            </span>
                          ) : (
                            part
                          ),
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {hero.running && (
              <Link
                data-motion="hero-item"
                href={hero.running.href}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pr-3 pl-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <span aria-hidden className="running-spinner text-sm leading-none text-primary" />
                <span className="font-medium whitespace-nowrap text-foreground">1 running</span>
                <span className="hidden sm:inline">{hero.running.label}</span>
                <span className="whitespace-nowrap sm:hidden">{hero.running.short}</span>
              </Link>
            )}
          </div>

          {/* On wide screens the photo fills the hero's full height, beside the text and buttons. */}
          <div className="justify-self-center md:col-start-2 md:row-start-1 md:row-span-2 md:w-full md:self-stretch">
            <div data-motion="photo" className="relative size-56 overflow-hidden rounded-xl border border-border shadow-brutal md:size-auto md:h-full md:max-h-[30rem] md:min-h-80 md:w-full">
              <Image
                src={person.photo}
                alt={person.name}
                fill
                sizes="(min-width: 768px) 320px, 224px"
                priority
                className="object-cover object-[50%_30%]"
              />
              {/* A light wash of the palette in difference blend: cyan and blue at the top, purple and gold below. Kept faint so skin tones stay natural. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-difference"
                style={{
                  background:
                    "linear-gradient(160deg, color-mix(in srgb, var(--accent-1) 30%, transparent), color-mix(in srgb, var(--primary) 15%, transparent) 40%, color-mix(in srgb, var(--accent-2) 20%, transparent) 70%, color-mix(in srgb, var(--accent-4) 30%, transparent))",
                }}
              />
              {/* While the photo "generates" (motion.tsx): noise, a scan line and a progress chip. */}
              <div data-motion="photo-gen" aria-hidden className="pointer-events-none absolute inset-0 hidden">
                <div className="photo-gen-noise absolute inset-0" />
                <div className="photo-gen-scan absolute inset-x-0 h-24" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-border bg-card/85 px-2.5 py-1 font-sans text-xs font-medium text-foreground backdrop-blur">
                  <span className="label-spark">✻</span>
                  <span data-photo-gen-label>Generating image…</span>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up chips, like the suggested replies after an AI chat answer. */}
          <nav aria-label="Suggested next steps" className="flex flex-wrap justify-center gap-2 md:justify-start">
            {hero.followUps.map((f, i) => {
              const href = f.href === "mailto:" ? (contact.email ? `mailto:${contact.email}` : null) : f.href;
              if (!href) return null;
              const external = href.startsWith("mailto:") || href.endsWith(".pdf");
              const className = `follow-up group inline-flex items-center gap-1.5 rounded-full border py-2 pr-4 pl-3 text-sm font-medium transition-colors ${
                i === 0
                  ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20"
                  : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`;
              const inner = (
                <>
                  <CornerDownRight aria-hidden className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
                  {f.label}
                </>
              );
              return external ? (
                <a key={f.label} data-motion="hero-item" href={href} className={className}>
                  {inner}
                </a>
              ) : (
                <Link key={f.label} data-motion="hero-item" href={href} className={className}>
                  {inner}
                </Link>
              );
            })}
          </nav>
        </section>

        {stats.length > 0 && (
        <section className="pb-20">
          <SectionLabel className="mb-10" verb="Measuring">Impact</SectionLabel>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.value} className="flex flex-col">
                <span className="font-heading text-4xl font-semibold text-foreground md:text-5xl">
                  {stat.value}
                </span>
                <p className="mt-3 text-sm text-muted-foreground">{stat.description}</p>
                {stat.href && (
                  <Link
                    href={stat.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-normal text-link hover:underline"
                  >
                    Learn more →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
        )}

        {fits.items.length > 0 && (
          <section className="pb-20">
            <SectionLabel verb="Reflecting">Why the journey matters</SectionLabel>

            <p data-reveal className="text-lg text-muted-foreground">{fits.lead}</p>

            {/* Each sits under a top rule, three across on wide screens: where it came from, then what it gives. */}
            <div data-reveal-group className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
              {fits.items.map((fit) => (
                <div key={fit.title} className="flex flex-col border-t-2 border-border pt-5">
                  <span className="text-sm font-semibold text-link">From: {fit.from}</span>
                  <h3 className="mt-1 text-2xl font-semibold text-foreground">{fit.title}</h3>
                  <p className="mt-2 flex-1 text-muted-foreground">{fit.description}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Proof:{" "}
                    <Link href={fit.proofHref} className="underline underline-offset-4 hover:text-foreground">
                      {fit.proofLabel}
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {showAi && (
          <section className="pb-24">
            <AiPanel
              chat={features.chat}
              fitCheck={features.fitCheck}
              parseJd={features.parseJd}
              mcp={features.mcp}
              cv={features.cv}
              mcpUrl={`${siteUrl}/api/mcp`}
            />
          </section>
        )}

        {traits.length > 0 && (
          <section className="pb-20">
            <SectionLabel verb="Reasoning">How I work</SectionLabel>

            <TraitRows traits={traits.slice(0, HOME_TRAITS)} />

            {traits.length > HOME_TRAITS && (
              <div data-reveal className="mt-8 flex justify-center">
                <Button variant="neutral" size="lg" asChild>
                  <Link href="/how-i-work">See how I work →</Link>
                </Button>
              </div>
            )}
          </section>
        )}

        {(systems.length > 0 || credentials.length > 0) && (
          <section className="pb-20">
            <SectionLabel verb="Verifying">Systems and credentials</SectionLabel>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr]">
              {systems.length > 0 && (
                <div>
                  <h3 data-reveal className="font-sans text-sm font-semibold text-muted-foreground">Systems I have designed</h3>
                  <ul data-reveal-group className="mt-2 divide-y divide-border">
                    {systems.map((system) => (
                      <li key={system.title} className="py-4">
                        <p className="font-heading text-lg font-semibold text-foreground">{system.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{system.description}</p>
                        <Link
                          href={system.proofHref}
                          className="mt-2 inline-block text-sm font-normal text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          Proof: {system.proofLabel}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {credentials.length > 0 && (
                <div>
                  <h3 data-reveal className="font-sans text-sm font-semibold text-muted-foreground">Certificates and education</h3>
                  <ul data-reveal-group className="mt-2 divide-y divide-border">
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
                </div>
              )}
            </div>
          </section>
        )}

        <section className="pb-20">
          <SectionLabel verb="Indexing">Stack</SectionLabel>

          <CollapsibleTagRow>
            {stackNames.map((name) => (
              <StackChip key={name} label={name} />
            ))}
          </CollapsibleTagRow>
        </section>

        {journey.steps.length > 0 && (
        <section className="pb-24">
          <SectionLabel verb="Recalling">Journey</SectionLabel>

          <p data-reveal className="max-w-2xl font-heading text-3xl font-semibold text-balance md:text-4xl">
            {journey.heading}
          </p>

          {/* A timeline: each step sits under a top rule, four across on wide screens. */}
          <div data-reveal-group className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {journey.steps.map((step) => (
              <div key={step.period} className="border-t-2 border-border pt-5">
                <span className="font-heading text-xl font-semibold text-link">{step.period}</span>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <Link
            data-reveal
            href="/experience"
            className="mt-6 inline-flex items-center gap-1 text-sm font-normal text-link hover:underline"
          >
            See full experience →
          </Link>
        </section>
        )}

        <section id="work" className="pb-24">
          <SectionLabel verb="Retrieving">Selected work</SectionLabel>

          <div data-reveal-group className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="h-full gap-0 overflow-hidden py-0 transition-transform">
                  <ProjectCoverImage
                    id={project.id}
                    coverImageUrl={project.coverImageUrl}
                    title={project.title}
                    year={project.year}
                    yearRange={project.yearRange}
                    years={project.years}
                    category={project.category}
                    liveUrl={project.liveUrl}
                    repoUrl={project.repoUrl}
                  />
                  <CardHeader className="pt-5">
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription>{project.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 pt-3 pb-6">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={tag.kind === "industry" ? "accent" : "default"}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div data-reveal className="mt-10 flex justify-center">
            <Button variant="neutral" size="lg" asChild>
              <Link href="/projects">See all work →</Link>
            </Button>
          </div>
        </section>

        {features.cv && (
        <section className="mb-12">
          <Card data-reveal className="flex-row flex-wrap items-center justify-between gap-6 bg-foreground py-8 text-background">
            <CardContent className="px-6">
              <h3 className="text-2xl font-semibold">Want the full picture?</h3>
              <p className="mt-1 text-background/80">
                The CV and project write-ups have the details.
              </p>
            </CardContent>
            <CardContent className="px-6">
              <Button size="lg" asChild>
                <a href="/cv">Download CV →</a>
              </Button>
            </CardContent>
          </Card>
        </section>
        )}

        {personalProjects.length > 0 && (
          <section className="pb-24">
            <SectionLabel verb="Exploring">Side projects</SectionLabel>

            <div data-reveal-group className="grid gap-6 md:grid-cols-2">
              {personalProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`}>
                  <Card className="h-full gap-0 overflow-hidden py-0 transition-transform">
                    <ProjectCoverImage
                      id={project.id}
                      coverImageUrl={project.coverImageUrl}
                      title={project.title}
                      year={project.year}
                      yearRange={project.yearRange}
                      years={project.years}
                      category={project.category}
                      liveUrl={project.liveUrl}
                      repoUrl={project.repoUrl}
                    />
                    <CardHeader className="pt-5">
                      <CardTitle className="text-xl">{project.title}</CardTitle>
                      <CardDescription>{project.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 pt-3 pb-6">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={tag.kind === "industry" ? "accent" : "default"}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button variant="neutral" size="lg" asChild>
                <Link href="/side-projects">See all side projects →</Link>
              </Button>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
        <section className="pb-24">
          <SectionLabel className="mb-10" verb="Pondering">FAQ</SectionLabel>

          <FaqChat
            faqs={faqs.map(({ id, question, answer }) => ({ id, question, answer }))}
            className="mx-auto max-w-3xl"
          />
        </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StackChip({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-bold shadow-brutal-sm">
      {label}
    </span>
  );
}
