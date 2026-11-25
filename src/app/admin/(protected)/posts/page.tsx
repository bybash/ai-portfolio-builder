import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { postDate, readingMinutes } from "@/lib/post-text";
import { prisma } from "@/lib/prisma";
import { getFeatures } from "@/lib/site-settings";

import { PostList } from "./post-list";

export default async function AdminPostsPage() {
  const { blog } = await getFeatures();
  const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Posts</h1>
          <p className="mt-2 text-muted-foreground">Write here, publish on the site, then share on LinkedIn.</p>
        </div>
        <Button pixel asChild>
          <Link href="/admin/posts/new">
            <Plus /> New post
          </Link>
        </Button>
      </div>
      {!blog && (
        <p className="mb-6 rounded-lg border border-border bg-card p-4 text-sm">
          The blog is hidden from visitors. Switch it on in{" "}
          <Link href="/admin/settings/features" className="underline">
            Settings, Features
          </Link>{" "}
          when the first post is ready.
        </p>
      )}
      <PostList
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          summary: p.summary,
          status: p.status,
          coverImageUrl: p.coverImageUrl,
          linkedinUrl: p.linkedinUrl,
          date: p.status === "published" ? `Published ${postDate(p.publishedAt)}` : `Edited ${postDate(p.updatedAt)}`,
          minutes: readingMinutes(p.body),
        }))}
      />
    </div>
  );
}
