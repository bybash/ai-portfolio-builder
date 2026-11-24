"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { aiConfigured } from "@/lib/ai-client";
import { requireAdmin } from "@/lib/auth";
import { purgeCdn } from "@/lib/cdn";
import { imagesConfigured } from "@/lib/ai-env";
import { draftPost } from "@/lib/post-draft";
import { generateCoverImage } from "@/lib/post-cover-ai";
import { postSchema, TODO_PATTERN, type PostInput } from "@/lib/post-schema";
import { prisma } from "@/lib/prisma";
import { syncRagIndexAfterResponse } from "@/lib/rag-sync-after";

export type SaveResult =
  | { ok: true; id: string; status: "draft" | "published" }
  | { ok: false; error: string };

// "save" keeps the current status.
const intentSchema = z.enum(["save", "publish", "unpublish"]);

async function refreshPosts(slug: string) {
  syncRagIndexAfterResponse();
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  await purgeCdn();
}

export async function savePost(id: string | null, raw: PostInput, rawIntent: z.infer<typeof intentSchema>): Promise<SaveResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(raw);
  const intent = intentSchema.safeParse(rawIntent);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!intent.success) return { ok: false, error: "Invalid action." };

  const existing = id ? await prisma.post.findUnique({ where: { id } }) : null;
  if (id && !existing) return { ok: false, error: "This post no longer exists." };

  const status =
    intent.data === "publish" ? "published" : intent.data === "unpublish" ? "draft" : (existing?.status ?? "draft");
  const input = parsed.data;
  if (status === "published" && [input.title, input.summary, input.body].some((t) => TODO_PATTERN.test(t))) {
    return { ok: false, error: "There is still a [TODO] in the post. Resolve it before publishing." };
  }
  // Once public, the address stays: links and the copies elsewhere point to it.
  if (existing?.publishedAt && existing.slug !== input.slug) {
    return { ok: false, error: "The slug can't change after the post has been published." };
  }

  const data = {
    ...input,
    coverImageUrl: input.coverImageUrl || null,
    linkedinUrl: input.linkedinUrl || null,
    status,
    publishedAt: existing?.publishedAt ?? (status === "published" ? new Date() : null),
  } as const;
  try {
    const post = existing
      ? await prisma.post.update({ where: { id: existing.id }, data })
      : await prisma.post.create({ data });
    await refreshPosts(post.slug);
    return { ok: true, id: post.id, status: post.status };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "That slug is already in use." };
    }
    console.error("Saving the post failed", e);
    return { ok: false, error: "Could not save the post." };
  }
}

export async function deletePost(id: string) {
  await requireAdmin();
  const post = await prisma.post.delete({ where: { id } });
  await refreshPosts(post.slug);
}

const draftRequestSchema = z.object({ topic: z.string().trim().min(3).max(300), notes: z.string().trim().max(12_000) });

export async function generateDraft(topic: string, notes: string) {
  await requireAdmin();
  if (!aiConfigured()) return { ok: false as const, error: "Set AI_API_KEY to draft with AI." };
  const parsed = draftRequestSchema.safeParse({ topic, notes });
  if (!parsed.success) return { ok: false as const, error: "Add a topic (and keep the notes under 12,000 characters)." };
  try {
    return { ok: true as const, draft: await draftPost(parsed.data.topic, parsed.data.notes) };
  } catch (e) {
    console.error("Drafting the post failed", e);
    return { ok: false as const, error: "The AI draft failed. Try again." };
  }
}

const coverRequestSchema = z.object({
  title: z.string().trim().min(1).max(150),
  summary: z.string().trim().max(1000),
  idea: z.string().trim().max(1000),
});

export async function generateCover(raw: z.infer<typeof coverRequestSchema>) {
  await requireAdmin();
  if (!imagesConfigured()) return { ok: false as const, error: "AI covers need an OpenRouter key." };
  const parsed = coverRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Add a title first." };
  try {
    return { ok: true as const, ...(await generateCoverImage(parsed.data)) };
  } catch (e) {
    console.error("Making the cover failed", e);
    return { ok: false as const, error: "The cover could not be made. Try again, or choose an image." };
  }
}
