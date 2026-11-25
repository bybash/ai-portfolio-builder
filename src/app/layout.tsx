import type { Metadata } from "next";
import { Geist_Mono, Inter, Playfair_Display } from "next/font/google";

import { siteConfig, siteUrl } from "@/lib/config";

import { MailtoFallback } from "@/components/mailto-fallback";
import { Motion } from "@/components/motion";
import { readableOn } from "@/lib/contrast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Serif for headings and the name
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const { seo, person, theme, darkTheme } = siteConfig;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: seo.title,
  description: seo.description,
  robots: seo.index ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    title: seo.title,
    description: seo.description,
    url: siteUrl,
    siteName: person.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
};

// A palette from site.config.ts as CSS variable declarations.
const themeVars = (theme: NonNullable<typeof darkTheme>) => [
  ["--background", theme.background],
  ["--foreground", theme.foreground],
  ["--card", theme.card],
  ["--muted", theme.muted],
  ["--muted-foreground", theme.mutedForeground],
  ["--primary", theme.primary],
  ["--primary-foreground", theme.primaryForeground],
  // Links and highlighted words: the primary hue, darkened (or lightened) if needed to read on the background.
  ["--link", readableOn(theme.primary, theme.background)],
  ["--secondary", theme.secondary],
  ["--secondary-foreground", theme.secondaryForeground],
  ["--accent", theme.accent],
  ["--accent-foreground", theme.accentForeground],
  ...theme.accents.slice(0, 5).map((c, i) => [`--accent-${i + 1}`, c]),
]
  // Only plain colour values reach the stylesheet.
  .filter(([, v]) => /^[#a-zA-Z0-9(),.%\s-]+$/.test(v))
  .map(([k, v]) => `${k}:${v}`)
  .join(";");

// The palettes as CSS variables over the defaults in globals.css. The dark one
// applies while <html> has the "dark" class.
const themeCss = `:root{${themeVars(theme)}}` + (darkTheme ? `:root.dark{${themeVars(darkTheme)}}` : "");

// Runs before the page paints, so dark mode never flashes light: the saved
// choice from the header switch, otherwise the system setting.
const darkModeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

// Turns page motion on before the first paint, unless the visitor asked for
// reduced motion (see src/components/motion.tsx). It also removes HTML
// comments (and the stray text around them) from <head>: Netlify's free plan
// inserts one there, and React would treat it as a hydration mismatch and
// re-render the page from scratch, dropping the "dark" and "motion" classes.
const motionScript = `try{for(var n=document.head.firstChild;n;){var x=n.nextSibling;if(n.nodeType===8||n.nodeType===3)n.remove();n=x}}catch(e){}try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.classList.add("motion");var v=performance.getEntriesByType("navigation")[0];if(location.pathname==="/"&&!(v&&v.type==="back_forward"))document.documentElement.classList.add("hero-playing")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{themeCss}</style>
        {/* Points AI tools reading any page to the site as plain text. */}
        <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Everything on this site as Markdown" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="Site map for AI tools (llms.txt)" />
        {darkTheme && <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />}
        <script dangerouslySetInnerHTML={{ __html: motionScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Motion />
        <MailtoFallback />
      </body>
    </html>
  );
}
