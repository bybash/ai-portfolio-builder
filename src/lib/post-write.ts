import type { Prisma } from "@/generated/prisma/client";
import { postSchema, slugify } from "@/lib/post-schema";

/** Checks and stores a new draft. Never published: a person does that in /admin. */
export async function createDraft(
  client: Prisma.TransactionClient,
  draft: { title: string; summary: string; body: string; tags?: string[]; slug?: string },
) {
  const data = postSchema.parse({
    ...draft,
    tags: draft.tags ?? [],
    slug: draft.slug || slugify(draft.title),
    coverImageUrl: "",
    linkedinUrl: "",
  });
  return client.post.create({ data: { ...data, coverImageUrl: null, linkedinUrl: null, status: "draft" } });
}
