import { notFound } from "next/navigation";

import { PostEditor } from "@/components/admin/post-editor";
import { aiConfigured } from "@/lib/ai-client";
import { imagesConfigured } from "@/lib/ai-env";
import { siteUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <PostEditor
      key={post.id}
      aiReady={aiConfigured()} coversReady={imagesConfigured()}
      siteUrl={siteUrl}
      post={{
        stored: {
          id: post.id,
          status: post.status,
          slugLocked: post.publishedAt !== null,
          slug: post.slug,
          version: post.updatedAt.toISOString(),
        },
        input: {
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          body: post.body,
          tags: post.tags,
          coverImageUrl: post.coverImageUrl ?? "",
          linkedinUrl: post.linkedinUrl ?? "",
        },
      }}
    />
  );
}
