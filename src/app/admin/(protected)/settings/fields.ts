import type { FieldSpec } from "@/components/admin/settings-form";
import { TRAIT_ICON_NAMES } from "@/components/trait-rows";

// What each settings form shows. The keys match site.config.ts, and the
// schemas in src/lib/site-settings-schema.ts check every save.

const BOLD = "**double asterisks** make words bold.";

const proofFields: FieldSpec[] = [
  { kind: "text", key: "proofLabel", label: "Proof label", placeholder: "Route Ledger" },
  { kind: "text", key: "proofHref", label: "Proof link", placeholder: "/projects/route-ledger" },
];

export const heroFields: FieldSpec[] = [
  { kind: "text", key: "headlineBefore", label: "Headline, before the highlight" },
  { kind: "text", key: "headlineHighlight", label: "Highlighted words" },
  { kind: "text", key: "headlineAfter", label: "Headline, after the highlight" },
  { kind: "strings", key: "paragraphs", label: "Intro paragraphs", help: BOLD, multiline: true, addLabel: "Add paragraph" },
  {
    kind: "list",
    key: "log",
    label: "Activity log",
    help: "Agent-style lines under the intro. {n} marks a number that counts up, for example {9} years. Leave empty to hide.",
    addLabel: "Add line",
    fields: [
      { kind: "text", key: "verb", label: "Verb", placeholder: "Shipped" },
      { kind: "text", key: "text", label: "Text", placeholder: "an offline route app with {0} lost records" },
    ],
  },
  {
    kind: "group",
    key: "running",
    label: "\"1 running\" chip",
    help: "The current role, with a spinner.",
    nullable: true,
    fields: [
      { kind: "text", key: "label", label: "Label" },
      { kind: "text", key: "short", label: "Short label on phones" },
      { kind: "text", key: "href", label: "Link", placeholder: "/projects/route-ledger" },
    ],
  },
  {
    kind: "list",
    key: "followUps",
    label: "Follow-up chips",
    help: "Like suggested replies after an AI answer. The first is highlighted. A link of mailto: uses the contact email.",
    addLabel: "Add chip",
    fields: [
      { kind: "text", key: "label", label: "Label" },
      { kind: "text", key: "href", label: "Link" },
    ],
  },
  { kind: "text", key: "badge", label: "Badge above the headline", help: "Leave empty, with no extra badges, to hide the row." },
  { kind: "strings", key: "extraBadges", label: "Extra badges", addLabel: "Add badge" },
];

export const homeFields: FieldSpec[] = [
  {
    kind: "list",
    key: "stats",
    label: "Impact stats",
    help: "Leave empty to hide the section.",
    addLabel: "Add stat",
    fields: [
      { kind: "text", key: "value", label: "Value", placeholder: "38%" },
      { kind: "text", key: "href", label: "Link" },
      { kind: "text", key: "description", label: "Description", multiline: true },
    ],
  },
  {
    kind: "group",
    key: "fits",
    label: "Why the journey matters",
    help: "What each part of the past brings to the work now. Leave the items empty to hide.",
    fields: [
      { kind: "text", key: "lead", label: "Lead", multiline: true },
      {
        kind: "list",
        key: "items",
        label: "Items",
        addLabel: "Add item",
        fields: [
          { kind: "text", key: "from", label: "From", placeholder: "Civil engineering" },
          { kind: "text", key: "title", label: "Title" },
          { kind: "text", key: "description", label: "Description", multiline: true },
          ...proofFields,
        ],
      },
    ],
  },
  {
    kind: "group",
    key: "journey",
    label: "Journey",
    help: "Shown on the home page and the About page. Leave the steps empty to hide.",
    fields: [
      { kind: "text", key: "heading", label: "Heading" },
      {
        kind: "list",
        key: "steps",
        label: "Steps",
        addLabel: "Add step",
        fields: [
          { kind: "text", key: "period", label: "Period", placeholder: "2017 to 2021" },
          { kind: "text", key: "description", label: "Description", multiline: true },
        ],
      },
    ],
  },
];

export const howFields: FieldSpec[] = [
  {
    kind: "list",
    key: "traits",
    label: "How I work",
    help: "Each habit with the case study that proves it. The home page shows the first four, /how-i-work shows all.",
    addLabel: "Add trait",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "select", key: "icon", label: "Icon", options: TRAIT_ICON_NAMES },
      { kind: "text", key: "description", label: "Description", multiline: true },
      ...proofFields,
    ],
  },
  {
    kind: "list",
    key: "systems",
    label: "Systems designed",
    addLabel: "Add system",
    fields: [
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "description", label: "Description", multiline: true },
      ...proofFields,
    ],
  },
  {
    kind: "list",
    key: "credentials",
    label: "Certificates and education",
    help: "Newest first. The year can be empty.",
    addLabel: "Add credential",
    fields: [
      { kind: "text", key: "year", label: "Year" },
      { kind: "text", key: "title", label: "Title" },
      { kind: "text", key: "issuer", label: "Issuer", multiline: true },
    ],
  },
];

export const stackFields: FieldSpec[] = [
  {
    kind: "strings",
    key: "stackOrder",
    label: "Stack order",
    help: "These chips come first, in this order, before the other project tags. Names that are not project tags show too.",
    addLabel: "Add name",
  },
  {
    kind: "strings",
    key: "stackHide",
    label: "Hidden tags",
    help: "Project tags to leave out of the stack chips. They still show on the projects.",
    addLabel: "Add tag",
  },
];

export const aboutFields: FieldSpec[] = [
  { kind: "text", key: "intro", label: "Intro", multiline: true },
  { kind: "strings", key: "paragraphs", label: "Paragraphs", help: `${BOLD} Leave empty to hide the bio.`, multiline: true, addLabel: "Add paragraph" },
];

export const sessionFields: FieldSpec[] = [
  { kind: "text", key: "version", label: "Version", placeholder: "v9", help: "Beside the name, for example years of building software." },
  { kind: "text", key: "versionTitle", label: "Version tooltip" },
  { kind: "text", key: "subtitle", label: "Role line" },
  { kind: "text", key: "home", label: "Home directory", placeholder: "~/odile", help: "The page's path is added after it." },
];

export const footerFields: FieldSpec[] = [
  { kind: "text", key: "builtWith", label: "Credit line", help: "Plain text; [label](https://...) becomes a link. Leave empty to hide." },
];
