import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/config";
import { publishedPosts } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { getFeatures } from "@/lib/site-settings";

// Read per request, so `next build` never needs a database.
export const dynamic = "force-dynamic";

const PAGES = ["", "/about", "/projects", "/how-i-work", "/experience", "/side-projects"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const features = await getFeatures();
  const projects = await prisma.project.findMany({ select: { slug: true, updatedAt: true } });
  const posts = await publishedPosts();
  return [
    ...PAGES.map((path) => ({ url: `${siteUrl}${path}` })),
    ...(features.blog ? [{ url: `${siteUrl}/blog` }] : []),
    ...posts.map((p) => ({ url: `${siteUrl}/blog/${p.slug}`, lastModified: p.updatedAt })),
    ...(features.cv ? [{ url: `${siteUrl}/cv.pdf` }] : []),
    // Plain-text versions for AI tools (see /agents.md).
    { url: `${siteUrl}/llms.txt` },
    { url: `${siteUrl}/llms-full.txt` },
    { url: `${siteUrl}/agents.md` },
    ...projects.map((p) => ({ url: `${siteUrl}/projects/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
