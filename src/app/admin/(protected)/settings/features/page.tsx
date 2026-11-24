import { SettingsForm, type FieldSpec } from "@/components/admin/settings-form";
import { aiConfigured, embeddingsConfigured } from "@/lib/ai-env";
import { envFlag, FEATURE_ENV, siteConfig } from "@/lib/config";
import { readSettings } from "@/lib/site-settings";
import { EDITABLE_FEATURES, type EditableFeature } from "@/lib/site-settings-schema";

const LABELS: Record<EditableFeature, { label: string; help: string }> = {
  chat: { label: "AI chat", help: "The \"Ask about\" tab on the home page, and the chat tool of the MCP server." },
  fitCheck: { label: "Job fit check", help: "The fit-check tab, and its MCP tool." },
  parseJd: { label: "File upload in the fit check", help: "PDF, .docx or .txt job descriptions. Needs the fit check." },
  mcp: { label: "MCP server", help: "The MCP tab and /api/mcp." },
  cv: { label: "CV download", help: "The CV buttons and /cv." },
  blog: { label: "Blog", help: "The /blog pages, the RSS feed and the Blog link. Posts are written in Posts, also while this is off." },
  easterEggs: { label: "Canned answers", help: "The easterEggs answers in site.config.ts, checked before the AI." },
};

const AI_FEATURES: EditableFeature[] = ["chat", "fitCheck", "parseJd", "mcp"];

export default async function FeaturesSettingsPage() {
  const stored = await readSettings();
  const aiReady = aiConfigured() && embeddingsConfigured();

  const fields: FieldSpec[] = EDITABLE_FEATURES.map((key) => {
    const env = envFlag(FEATURE_ENV[key]);
    const notes = [
      env !== undefined && `${FEATURE_ENV[key]} is ${env ? "true" : "false"} in the environment, which wins over this switch.`,
      AI_FEATURES.includes(key) && !aiReady && "Off on the site for now: no AI provider is set up (AI_API_KEY and embeddings).",
    ].filter(Boolean);
    return { kind: "boolean", key, ...LABELS[key], note: notes.join(" ") || undefined };
  });
  const initial = Object.fromEntries(EDITABLE_FEATURES.map((k) => [k, stored.features?.[k] ?? siteConfig.features[k]]));

  return (
    <SettingsForm
      key={JSON.stringify(stored.features ?? null)}
      section="features"
      title="Features"
      description="Switch parts of the site on or off. The admin area and the rate limits can only be changed in site.config.ts or the environment."
      fields={fields}
      initial={initial}
      saved={Boolean(stored.features)}
    />
  );
}
