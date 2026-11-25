import type { Prisma } from "@/generated/prisma/client";

/** The posts visitors may see: published ones, and none while the blog is off. */
export async function findPublishedPosts(client: Prisma.TransactionClient, blogOn: boolean) {
  if (!blogOn) return [];
  return client.post.findMany({ where: { status: "published" }, orderBy: [{ publishedAt: "desc" }, { id: "asc" }] });
}
