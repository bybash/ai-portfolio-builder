import { findPublishedPosts } from "@/lib/post-query";
import { prisma } from "@/lib/prisma";
import { getFeatures } from "@/lib/site-settings";

// Public reads of blog posts. Public pages go through these, so a draft never
// leaks. With the blog feature off there are no posts.

export async function publishedPosts() {
  return findPublishedPosts(prisma, (await getFeatures()).blog);
}

export async function publishedPost(slug: string) {
  if (!(await getFeatures()).blog) return null;
  return prisma.post.findFirst({ where: { slug, status: "published" } });
}
