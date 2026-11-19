"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGES = [
  { href: "/admin/settings/hero", label: "Hero" },
  { href: "/admin/settings/home", label: "Home" },
  { href: "/admin/settings/how-i-work", label: "How I work" },
  { href: "/admin/settings/stack", label: "Stack" },
  { href: "/admin/settings/about", label: "About" },
  { href: "/admin/settings/logo", label: "Logo and header" },
  { href: "/admin/settings/footer", label: "Footer" },
  { href: "/admin/settings/features", label: "Features" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="mb-8 flex flex-wrap gap-2">
      {PAGES.map((p) => {
        const active = pathname === p.href;
        return (
          <Link
            key={p.href}
            href={p.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </Link>
        );
      })}
    </nav>
  );
}
