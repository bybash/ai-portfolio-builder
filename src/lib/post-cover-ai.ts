import { chatJson } from "@/lib/ai-client";
import { aiSettings, imageModel } from "@/lib/ai-env";
import { siteConfig } from "@/lib/config";
import { MAX_MEDIA_BYTES, MEDIA_EXTENSIONS, sniffImageType } from "@/lib/media";
import { prisma } from "@/lib/prisma";

// How to turn an argument into a picture. Also used by the post draft's prompt.
export const COVER_IDEA_RULES =
  "one or two sentences describing a single scene for the cover: one main subject doing one thing in a specific place, at a moment with some tension, wonder or humour, with where the light comes from. Pick a surprising visual metaphor for the post's main argument that still reads at thumbnail size. Someone who sees it beside the title should be able to guess the subject, so show who is involved: if the post is about AI or agents, include a robot or machine character. Only things a painter could show: nothing unseen, implied or abstract. Not a diagram: no arrows, connected boxes, flowcharts, rows of icons or floating symbols, and no screens or pages full of code. No text in it, and no real people.";

async function suggestIdea(title: string, summary: string) {
  const raw = (await chatJson({
    system: `You art-direct blog covers. Respond with JSON: {"idea": string}. "idea" is ${COVER_IDEA_RULES}`,
    user: `TITLE:\n${title}\n\nSUMMARY:\n${summary}`,
  })) as { idea?: unknown };
  if (typeof raw?.idea !== "string" || !raw.idea.trim()) throw new Error("No cover idea came back.");
  return raw.idea.trim().slice(0, 1000);
}

type ImageResponse = { data?: { b64_json?: string }[]; usage?: { cost?: number } };

// OpenRouter's image API (https://openrouter.ai/docs, Image Generation).
async function requestImage(prompt: string, extras: Record<string, string>) {
  const { apiKey, baseURL } = aiSettings();
  return fetch(`${baseURL.replace(/\/+$/, "")}/images`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: imageModel(), prompt, ...extras }),
    signal: AbortSignal.timeout(90_000),
  });
}

/** Draws a cover for a post, stores it, and returns its path, scene and cost in US dollars. */
export async function generateCoverImage(post: { title: string; summary: string; idea: string }) {
  const idea = post.idea || (await suggestIdea(post.title, post.summary));
  const prompt = `Wide cover illustration for a blog post.
Scene: ${idea}
Style: ${siteConfig.blog.coverStyle}
The main subject is large, off-centre and easy to read at thumbnail size, filling at least half the height. One coherent scene, not a diagram or infographic: no arrows, connecting lines, icons, panels or scattered specks. Keep the edges calm. No text, letters, numbers, logos, watermarks, user interface or real people.`;

  let response = await requestImage(prompt, { aspect_ratio: "16:9", resolution: "1K", output_format: "jpeg" });
  // Not every model takes every option.
  if (response.status === 400) response = await requestImage(prompt, { aspect_ratio: "16:9" });
  if (!response.ok) throw new Error(`Image request failed: ${response.status} ${(await response.text()).slice(0, 300)}`);

  const result = (await response.json()) as ImageResponse;
  const data = new Uint8Array(Buffer.from(result.data?.[0]?.b64_json ?? "", "base64"));
  const type = sniffImageType(data);
  if (!type || data.byteLength > MAX_MEDIA_BYTES) throw new Error("The image model returned no usable image.");
  const media = await prisma.media.create({ data: { type, data }, select: { id: true } });
  return { url: `/media/${media.id}.${MEDIA_EXTENSIONS[type]}`, cost: result.usage?.cost ?? null, idea };
}
