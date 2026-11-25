import { z } from "zod";

// A web address or a path on this site; blocks javascript: and friends.
export const isUrlOrPath = (v: string) => /^https:\/\/\S+$/.test(v) || /^\/(?!\/)\S+$/.test(v);

const urlOrPath = z
  .string()
  .trim()
  .refine((v) => v === "" || isUrlOrPath(v), "Use an https:// address or a /path on this site.");

export const SUMMARY_MAX = 300;

export const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(150, "Keep the title under 150 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and single dashes."),
  summary: z.string().trim().min(1, "Summary is required.").max(SUMMARY_MAX, `Keep the summary under ${SUMMARY_MAX} characters.`),
  body: z.string().trim().min(1, "The post is empty."),
  coverImageUrl: urlOrPath,
  tags: z.array(z.string().trim().min(1)).max(8, "Use at most 8 tags."),
  linkedinUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https:\/\/([a-z]+\.)?linkedin\.com\//.test(v), "That is not a LinkedIn address."),
});

export type PostInput = z.infer<typeof postSchema>;

export type PostStatus = "draft" | "published";

/** What to draw on a cover; with no `idea`, the AI suggests a scene. */
export type CoverRequest = { title: string; summary: string; idea: string };

// The AI draft marks what it could not know; those must be resolved first.
export const TODO_PATTERN = /\[TODO\b/i;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
