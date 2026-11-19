"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Logo, type LogoMark } from "@/components/logo";
import { SocialIcon } from "@/components/social-icon";
import { ThemeToggle } from "@/components/theme-toggle";

export type SiteHeaderProps = {
  active?: "about" | "work" | "how" | "experience";
  back?: { href: string; label: string };
};

type SiteHeaderNavProps = SiteHeaderProps & {
  name: string;
  initials: string;
  mark: LogoMark;
  session: { version: string; versionTitle: string; subtitle: string; home: string };
  showCv: boolean;
  showThemeToggle: boolean;
  socials: { label: string; href: string }[];
};

// Question words, each page answering one. The page's own heading says plainly
// what it is (About me, Work, How I work, Experience), and so does `title`.
const NAV_LINKS = [
  { key: "about", href: "/about", label: "Who", title: "About me" },
  { key: "work", href: "/projects", label: "What", title: "Work" },
  { key: "how", href: "/how-i-work", label: "How", title: "How I work" },
  { key: "experience", href: "/experience", label: "When", title: "Experience" },
] as const;

// Icon buttons on the right of the header: social links, then the light / dark switch.
const ICON_BUTTON =
  "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground";

const navLinkClass = (isActive: boolean) =>
  `text-base font-medium ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`;

export function SiteHeaderNav({ active, back, name, initials, mark, session, showCv, showThemeToggle, socials }: SiteHeaderNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const cwd = pathname && pathname !== "/" ? `${session.home}${pathname}` : session.home;

  const iconButtons = (
    <div className="flex items-center gap-1">
      {socials.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={ICON_BUTTON}
        >
          <SocialIcon label={link.label} className="size-[18px]" />
        </a>
      ))}
      {showThemeToggle && <ThemeToggle className={ICON_BUTTON} />}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <nav className="flex items-center justify-between border-b border-border py-6">
        {/* The logo with a terminal-style session block: name and version, the
            current role, and a working directory that follows the page. */}
        <Link href="/" className="flex min-w-0 items-center gap-3" onMouseEnter={replayLogo}>
          <Logo initials={initials} mark={mark} className="size-10 shrink-0 lg:size-13" />
          <span className="flex min-w-0 flex-col font-mono text-xs leading-snug">
            <span className="whitespace-nowrap">
              <span className="text-sm font-semibold text-foreground">{name}</span>{" "}
              <span className="text-muted-foreground" title={session.versionTitle}>
                {session.version}
              </span>
            </span>
            <span className="hidden truncate text-muted-foreground lg:block">{session.subtitle}</span>
            <span className="hidden truncate text-muted-foreground/70 lg:block">{cwd}</span>
          </span>
        </Link>
        {back ? (
          <div className="flex items-center gap-4">
            <Link href={back.href} className={navLinkClass(false)}>
              {back.label}
            </Link>
            {showThemeToggle && <ThemeToggle className={ICON_BUTTON} />}
          </div>
        ) : (
          <>
            <div className="hidden items-center gap-6 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  title={link.title}
                  className={navLinkClass(active === link.key)}
                >
                  {link.label}
                </Link>
              ))}
              {showCv && (
                <Button asChild>
                  <a href="/cv">Download CV</a>
                </Button>
              )}
              <span aria-hidden="true" className="h-5 w-px bg-border" />
              {iconButtons}
            </div>

            <div className="flex items-center gap-1 md:hidden">
              {iconButtons}
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((v) => !v)}
                className={ICON_BUTTON}
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </>
        )}
      </nav>

      {!back && menuOpen && (
        <div className="flex flex-col gap-4 border-b border-border py-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={navLinkClass(active === link.key)}
            >
              {link.label} <span className="text-muted-foreground">· {link.title}</span>
            </Link>
          ))}
          {showCv && (
            <Button asChild className="self-start">
              <a href="/cv">Download CV</a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Replays the pixel logo's extrusion (see [data-pixel-logo] in globals.css).
function replayLogo(event: React.MouseEvent<HTMLElement>) {
  if (!document.documentElement.classList.contains("motion")) return;
  event.currentTarget.querySelectorAll<SVGGElement>("[data-pixel-logo] [data-layer]").forEach((layer) => {
    layer.style.animation = "none";
    void layer.getBoundingClientRect();
    layer.style.animation = "pixel-extrude calc(var(--k) * 110ms) steps(var(--k)) both";
  });
}
