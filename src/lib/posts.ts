import { prisma } from "@/lib/prisma";
import { getFeatures } from "@/lib/site-settings";

// Public reads of blog posts. Everything outside /admin goes through these, so
// a draft never leaks. With the blog feature off there are no posts.

export async function publishedPosts() {
  if (!(await getFeatures()).blog) return [];
  return prisma.post.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
  });
}

export async function publishedPost(slug: string) {
  if (!(await getFeatures()).blog) return null;
  return prisma.post.findFirst({ where: { slug, status: "published" } });
}

export function postDate(date: Date | null) {
  return date?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) ?? "";
}

export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.trim().split(/\s+/).length / 220));
}
