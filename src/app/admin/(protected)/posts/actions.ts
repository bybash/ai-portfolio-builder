"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Prisma, type Post } from "@/generated/prisma/client";
import { aiConfigured } from "@/lib/ai-client";
import { requireAdmin } from "@/lib/auth";
import { imagesConfigured } from "@/lib/ai-env";
import { purgeCdn } from "@/lib/cdn";
import { draftPost } from "@/lib/post-draft";
import { generateCoverImage } from "@/lib/post-cover-ai";
import { postSchema, TODO_PATTERN, type CoverRequest, type PostInput, type PostStatus } from "@/lib/post-schema";
import { prisma } from "@/lib/prisma";
import { syncRagIndexAfterResponse } from "@/lib/rag-sync-after";

type StoredPost = { id: string; status: PostStatus; slugLocked: boolean; slug: string; version: string };

export type SaveResult =
  | { ok: true; post: StoredPost }
  // `conflict` is the stored version, when it is not the one the editor opened.
  | { ok: false; error: string; conflict?: string };

// "save" keeps the current status.
const intentSchema = z.enum(["save", "publish", "unpublish"]);
export type SaveIntent = z.infer<typeof intentSchema>;

const targetSchema = z.object({ id: z.string(), version: z.iso.datetime() }).nullable();

// No revalidatePath here: every page that shows posts renders per request, and
// a refresh of the open editor would replace what is being typed.
async function afterChange(post: Pick<Post, "id" | "status">) {
  // Out of the chat at once, even if the index update below fails.
  if (post.status !== "published") await prisma.chunk.deleteMany({ where: { sourceType: "post", sourceId: post.id } });
  syncRagIndexAfterResponse();
  await purgeCdn();
}

const toStored = (post: Post): StoredPost => ({
  id: post.id,
  status: post.status,
  slugLocked: post.publishedAt !== null,
  slug: post.slug,
  version: post.updatedAt.toISOString(),
});

const CONFLICT = "This post was changed somewhere else. Yours is not saved.";

export async function savePost(rawTarget: { id: string; version: string } | null, raw: PostInput, rawIntent: SaveIntent): Promise<SaveResult> {
  await requireAdmin();
  const parsed = postSchema.safeParse(raw);
  const intent = intentSchema.safeParse(rawIntent);
  const target = targetSchema.safeParse(rawTarget);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  if (!intent.success || !target.success) return { ok: false, error: "Invalid action." };

  const existing = target.data ? await prisma.post.findUnique({ where: { id: target.data.id } }) : null;
  if (target.data && !existing) return { ok: false, error: "This post no longer exists." };
  if (existing && existing.updatedAt.toISOString() !== target.data!.version) {
    return { ok: false, error: CONFLICT, conflict: existing.updatedAt.toISOString() };
  }

  const status: PostStatus =
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
  };
  try {
    let post: Post;
    if (existing) {
      // Only if it is still the version read above.
      const [changed] = await prisma.post.updateManyAndReturn({ where: { id: existing.id, updatedAt: existing.updatedAt }, data });
      if (!changed) {
        const now = await prisma.post.findUnique({ where: { id: existing.id }, select: { updatedAt: true } });
        return { ok: false, error: CONFLICT, conflict: now?.updatedAt.toISOString() };
      }
      post = changed;
    } else {
      post = await prisma.post.create({ data });
    }
    await afterChange(post);
    return { ok: true, post: toStored(post) };
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
  await prisma.post.delete({ where: { id } });
  await afterChange({ id, status: "draft" });
  revalidatePath("/admin/posts");
}

export type GeneratedDraft = Awaited<ReturnType<typeof draftPost>>;

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

export async function generateCover(raw: CoverRequest) {
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
