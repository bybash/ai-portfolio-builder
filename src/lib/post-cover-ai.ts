import { chatJson, drawImage } from "@/lib/ai-client";
import { siteConfig } from "@/lib/config";
import { storeImage } from "@/lib/media-store";
import type { CoverRequest } from "@/lib/post-schema";

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

/** Draws a cover for a post, stores it, and returns its path, scene and cost in US dollars. */
export async function generateCoverImage(post: CoverRequest) {
  const idea = post.idea || (await suggestIdea(post.title, post.summary));
  const prompt = `Wide cover illustration for a blog post.
Scene: ${idea}
Style: ${siteConfig.blog.coverStyle}
The main subject is large, off-centre and easy to read at thumbnail size, filling at least half the height. One coherent scene, not a diagram or infographic: no arrows, connecting lines, icons, panels or scattered specks. Keep the edges calm. No text, letters, numbers, logos, watermarks, user interface or real people.`;

  const image = await drawImage(prompt, "16:9");
  const url = await storeImage(image.data);
  if (!url) throw new Error("The image model returned no usable image.");
  return { url, cost: image.cost, idea };
}
