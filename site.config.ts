// Everything that makes this site *yours* lives in this one file.
//
// The sample values describe Odile Brandqvist, a fictional product engineer.
// Replace them with your own details, then replace the sample content in
// content/ (projects, experience, FAQs) and re-run `npm run db:seed` and
// `npm run rag:ingest`.
//
// Feature flags can also be switched per deployment with environment
// variables (see .env.example), which win over the values below.

import { type Theme, themes } from "./themes";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  // Public URL of the deployed site, no trailing slash. Used for SEO,
  // share images, the MCP connect command and the CV link the MCP returns.
  // NEXT_PUBLIC_SITE_URL overrides it.
  url: "http://localhost:3000",

  person: {
    name: "Odile Brandqvist",
    // Shown in the logo mark, the favicon and the share image.
    initials: "OB",
    // Used in the chat prompt and the MCP tool name (ask_about_<firstName>).
    firstName: "Odile",
    // he / she / they: used in a few UI sentences ("check her CV").
    pronouns: { subject: "she", object: "her", possessive: "her" },
    role: "Product Engineer",
    // The terminal-style session block beside the header logo: name, a version
    // (years of building software), the current role, and a working directory
    // that follows the page (`home` + the page's path).
    session: {
      version: "v9",
      versionTitle: "9 years of building software",
      subtitle: "Staff Product Engineer",
      home: "~/odile",
    },
    location: "Edinburgh, Scotland",
    // A square image in public/. Any format next/image supports.
    photo: "/avatar.svg",
    // Logo mark in public/ for the header and footer. Leave empty to draw the initial instead.
    logo: "",
    // The same mark for the dark theme (see darkTheme below).
    logoDark: "",
    // A pixel-art mark drawn instead of the logo image in the header, the
    // footer, the favicon, the app icons and the share image. `rows` is the
    // grid, "#" for a filled pixel; `colors` step diagonally, top left to
    // bottom right; `depth` extrudes the mark down and to the right by that
    // many pixels. Set to null to use the logo image or the initial.
    logoPixel: {
      rows: [
        "......##......",
        "......##......",
        ".....####.....",
        ".....####.....",
        "....######....",
        "..##########..",
        "##############",
        "##############",
        "..##########..",
        "....######....",
        ".....####.....",
        ".....####.....",
        "......##......",
        "......##......",
      ],
      colors: ["#06b6d4", "#2563eb", "#4b4ef0", "#8b5cf6", "#b23fd6", "#f472b6", "#f59e0b"],
      depth: 3,
    } as { rows: string[]; colors: string[]; depth?: number } | null,
    // One or two sentences used in the footer and by the chat assistant.
    oneLiner:
      "Product engineer who builds calm, offline-first software for people who work on their feet: drivers, nurses and warehouse teams.",
  },

  contact: {
    email: "hello@example.com",
  },

  // Rendered only when set. Leave a value empty ("") to hide it.
  socials: {
    github: "https://github.com/example",
    linkedin: "https://www.linkedin.com/in/example",
    x: "",
  },

  seo: {
    title: "Odile Brandqvist | Product Engineer",
    description: "Offline-first product engineering for teams that work away from a desk.",
    // Short line for the share (Open Graph) image.
    tagline: "Product Engineer, offline-first by default",
    // Let search engines index the site. Set to false while you are still
    // replacing the sample content.
    index: true,
  },

  // Colours for the whole site. The neo-brutalist structure (thick borders,
  // hard shadows) stays; the theme only changes the hues. Ready-made themes:
  // block, cobalt, coral, burst, twist, mint, playful, nature, earthy, the
  // pastels peach, lavender and sky, the neutrals stone, sand, slate and
  // graphite, and clay and gradient (see themes.ts). To change single colours:
  // theme: { ...themes.coral, primary: "#b83a22" },
  theme: themes.gradient,
  // Optional dark palette. When set, the site follows the visitor's system
  // setting and the header gets a light / dark switch. Set to null to turn it off.
  darkTheme: themes.gradientDark as Theme | null,

  hero: {
    // Chip above the headline, and extra chips after it. Leave both empty to
    // hide the row.
    badge: "",
    extraBadges: [] as string[],
    // The headline is split so the middle words get the highlight.
    headlineBefore: "Software that works",
    headlineHighlight: "offline",
    headlineAfter: "and still feels calm.",
    // **double asterisks** make a word bold.
    paragraphs: [
      "Nine years building **offline-first** apps for people who work away from a desk: delivery drivers, ward nurses and warehouse teams.",
      "I care about the boring parts that make software trustworthy: **sync**, **conflict handling** and screens you can read in bright sunlight.",
    ],
    // An agent-style activity log under the intro. `{n}` marks a number that
    // counts up as the line appears. Leave empty to hide.
    log: [
      { verb: "Explored", text: "{9} years of product engineering, after {3} in civil engineering" },
      { verb: "Shipped", text: "an offline route app with {0} lost records in two winters" },
      { verb: "Cut", text: "clinic check-in from {11} minutes to {4}" },
      { verb: "Ongoing", text: "offline-first mobile and dashboard work at Saltmarsh Transit Co." },
    ] as { verb: string; text: string }[],
    // The "still running" chip: the current role.
    // Set to null to hide.
    running: {
      label: "Staff Product Engineer at Saltmarsh Transit Co.",
      // Shown instead of `label` on phones.
      short: "Saltmarsh Transit",
      href: "/projects/route-ledger",
    } as { label: string; short: string; href: string } | null,
    // Follow-up chips under the intro, like the suggested replies after an AI
    // chat answer. The first one is highlighted. `mailto:` uses contact.email.
    followUps: [
      { label: "Show me the work", href: "/projects" },
      { label: "How do you work?", href: "/how-i-work" },
      { label: "Let's talk", href: "mailto:" },
    ] as { label: string; href: string }[],
  },

  home: {
    // Number stats. Leave the array empty to hide the section.
    stats: [
      {
        value: "38%",
        description: "Fewer missed delivery slots after the offline route app replaced paper manifests.",
        href: "/projects/route-ledger",
      },
      {
        value: "0",
        description: "Lost records across two winters of patchy rural signal, thanks to a sync queue with replay.",
        href: "/projects/route-ledger",
      },
      {
        value: "4 min",
        description: "Median check-in time at the clinic kiosk, down from eleven at the front desk.",
        href: "/projects/clinic-queue",
      },
      {
        value: "120+",
        description: "Allotment plots planned with the free crop rotation planner side project.",
        href: "/projects/allotment-planner",
      },
    ] as { value: string; description: string; href: string }[],
    // Why the journey matters: what each part of the past brings to the work
    // now, with its proof. Leave items empty to hide.
    fits: {
      lead: "Three years on building sites, then nine in product engineering. This is what that path brings to every project.",
      items: [
        {
          from: "Civil engineering",
          title: "Planning before building",
          description: "Site work taught me to sketch, measure and check before anything is poured. I still draw every screen on squared paper first.",
          proofLabel: "Experience",
          proofHref: "/experience",
        },
        {
          from: "Clinics and labs",
          title: "Software people trust",
          description: "Nurses and lab teams have no time for surprises, so I design for the worst day, not the demo.",
          proofLabel: "Clinic Queue",
          proofHref: "/projects/clinic-queue",
        },
        {
          from: "Freight and retail",
          title: "Working where the signal drops",
          description: "Drivers and shop floors taught me that offline is the normal case. Sync and conflict handling come first.",
          proofLabel: "Route Ledger",
          proofHref: "/projects/route-ledger",
        },
      ],
    },
    journey: {
      heading: "From bridges and drainage plans to offline-first product engineering.",
      steps: [
        {
          period: "2014 to 2017",
          description: "Graduate civil engineer at Lanternmoth Surveying, writing spreadsheet macros that slowly turned into small web tools.",
        },
        {
          period: "2017 to 2021",
          description: "Developer at Quillfern Labs, then product engineer at Fernwhistle Health, building lab and clinic software.",
        },
        {
          period: "2021 to now",
          description: "Senior then staff product engineer at Brindlecart and Saltmarsh Transit Co., leading offline-first mobile and dashboard work.",
        },
      ],
    },
    // How I work. Each trait links to the case study that proves it. `icon` is a
    // key in TRAIT_ICONS (src/components/trait-rows.tsx); colours cycle through
    // the theme's accent and accent tints. The home page shows the
    // first four, /how-i-work shows them all. Leave empty to hide.
    traits: [
      {
        title: "Offline is the normal case",
        icon: "package-open",
        description: "I design for no signal first and treat a connection as a bonus. Route Ledger kept every delivery record through two winters of patchy rural coverage.",
        proofLabel: "Route Ledger",
        proofHref: "/projects/route-ledger",
      },
      {
        title: "Close to the people using it",
        icon: "messages",
        description: "I ride along, shadow shifts and sit at the front desk before I build. The clinic kiosk came from a week watching the morning queue.",
        proofLabel: "Clinic Queue",
        proofHref: "/projects/clinic-queue",
      },
      {
        title: "Problem solving under constraints",
        icon: "puzzle",
        description: "When the obvious fix is too slow or too costly, I find another way in. Shelfwise forecasts stock from the till data stores already had, with no new hardware.",
        proofLabel: "Shelfwise",
        proofHref: "/projects/shelfwise",
      },
      {
        title: "Product mindset",
        icon: "target",
        description: "I build what people will use on their worst day, not what is fun to build, and I measure whether it worked.",
        proofLabel: "Route Ledger",
        proofHref: "/projects/route-ledger",
      },
      {
        title: "Quality by default",
        icon: "badge-check",
        description: "Written plans, reviewed code and accessible screens, not hope. The clinic kiosk was tested with screen readers before launch.",
        proofLabel: "Clinic Queue",
        proofHref: "/projects/clinic-queue",
      },
      {
        title: "Small tools, real use",
        icon: "sprout",
        description: "Side projects are where I try ideas out. The allotment planner started as a favour for one garden and now plans 120+ plots.",
        proofLabel: "Allotment Planner",
        proofHref: "/projects/allotment-planner",
      },
    ],
    // Stack chips, in this order, before any other project tags. Names that are
    // not project tags show too, for skills from roles without a case study.
    // The first two rows show; the rest sit behind "Show more".
    stackOrder: ["TypeScript", "React Native", "React", "Next.js", "SQLite", "PostgreSQL", "Offline-first"],
    // Project tags to leave out of the stack chips (they still show on the projects).
    stackHide: [] as string[],
    // Systems designed, each with its proof. Leave empty to hide.
    systems: [
      {
        title: "Sync queue with replay",
        description: "An on-device queue that records every change and replays it in order when the signal returns, with conflict rules agreed with dispatch.",
        proofLabel: "Route Ledger",
        proofHref: "/projects/route-ledger",
      },
      {
        title: "Self check-in and live queue",
        description: "A kiosk and waiting room screen that share one queue, built to keep working through network drops.",
        proofLabel: "Clinic Queue",
        proofHref: "/projects/clinic-queue",
      },
    ],
    // Certificates and education, newest first. Leave empty to hide.
    credentials: [
      { year: "2019", title: "Certified Accessibility Practitioner", issuer: "Example Accessibility Board" },
      { year: "2014", title: "BEng Civil Engineering", issuer: "Firthmouth University" },
    ],
  },

  // The Who page (/about). Leave paragraphs empty to hide the page's bio.
  about: {
    intro: "Product engineer who builds calm, offline-first software, based in Edinburgh.",
    paragraphs: [
      "Today I lead offline-first mobile and dashboard work at **Saltmarsh Transit Co.**, where drivers rely on the route app in places with no signal.",
      "Before that I built lab and clinic software at **Quillfern Labs** and **Fernwhistle Health**, and stock forecasting for small grocery stores at **Brindlecart**.",
      "Before software I was a **civil engineer**, which is why I still sketch everything on squared paper first.",
    ],
  },

  experience: {
    intro: "Nine years in product engineering, after three in civil engineering. Most of it spent on software that has to keep working when the signal does not.",
  },

  // The AI assistant ("Ask about ..." tab) and the MCP tool.
  chat: {
    tabLabel: "Ask about Odile",
    description: "Answers come from the project, experience and FAQ content on this site, not from general knowledge.",
    // Extra instructions about tone, added to the system prompt.
    style: "Friendly and plain. Refer to Odile in the third person.",
    // Buttons shown before the first message.
    suggestions: [
      "What has Odile built that works offline?",
      "Has Odile worked in healthcare?",
      "Which technologies does Odile use most?",
    ],
    // Typed into the empty input one by one, as a hint that visitors can type.
    placeholderPrompts: [
      "How did the route app handle sync conflicts?",
      "What did Odile do before software?",
      "Does Odile do design work too?",
      "What are the side projects about?",
    ],
  },

  fitCheck: {
    tabLabel: "Check job fit",
    description: "Paste a job description, or upload a PDF, .docx or .txt file, for a fit analysis grounded in the content on this site.",
    // What the fit check should weigh, added to its system prompt.
    criteria:
      "Weigh hands-on delivery, offline-first and sync experience, mobile and web product work, and working closely with non-technical users.",
  },

  mcp: {
    tabLabel: "MCP server",
    description: "This site is also a remote MCP server. Connect it to any MCP client (for example Claude Code or Claude Desktop) to ask questions or check a job fit from your own AI assistant.",
    // Name shown to MCP clients and used in the connect command.
    serverName: "odile-portfolio",
  },

  cv: {
    // A PDF in public/. The /cv route serves it as a download.
    file: "cv.pdf",
    // Filename the visitor's browser saves. {date} becomes e.g. "October-2026".
    downloadName: "Odile-Brandqvist-CV-{date}.pdf",
  },

  admin: {
    label: "Odile Brandqvist / admin",
  },

  footer: {
    // Plain text; [label](https://...) becomes a link.
    builtWith: "Built with [Claude Code](https://claude.com/claude-code), from [Mehmet Mutlu's template](https://github.com/mutlumehmet/ai-portfolio-builder)",
  },

  // Iframe embeds in project pages (embed blocks). An empty list allows any
  // https host; add hosts (e.g. "www.loom.com") to allow only those.
  embeds: {
    allowedHosts: [] as string[],
  },

  // Canned answers checked before the AI is called. Only used when the
  // easterEggs feature is on. Patterns are case-insensitive regular expressions.
  easterEggs: [
    {
      pattern: "\\b(salary|day rate|rate card|compensation)\\b",
      answer: "Happy to talk about that directly. Drop a line to {email} and we can find a time.",
    },
  ],

  // Defaults; each can be overridden with an env var (see .env.example).
  features: {
    chat: true,
    fitCheck: true,
    // Upload a PDF, .docx or .txt into the fit check. Needs fitCheck.
    parseJd: true,
    mcp: true,
    admin: true,
    cv: true,
    easterEggs: false,
    rateLimit: true,
  },

  rateLimit: {
    // Per visitor IP, shared by chat, fit check, file upload and MCP.
    perMinute: 10,
    perDay: 100,
  },
};
