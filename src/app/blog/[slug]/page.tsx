import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostBody } from "@/components/post-body";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SocialIcon } from "@/components/social-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, siteUrl } from "@/lib/config";
import { postDate, publishedPost, readingMinutes } from "@/lib/posts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await publishedPost((await params).slug);
  if (!post) return {};
  const title = `${post.title} | ${siteConfig.person.name}`;
  const url = `/blog/${post.slug}`;
  return {
    title,
    description: post.summary,
    // This page is the original, wherever else the article is posted.
    alternates: { canonical: url, types: { "application/rss+xml": "/blog/rss.xml" } },
    openGraph: {
      title: post.title,
      description: post.summary,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [siteConfig.person.name],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.summary },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await publishedPost((await params).slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", "@id": `${siteUrl}/#person`, name: siteConfig.person.name, url: siteUrl },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
    image: `${siteUrl}/blog/${post.slug}/opengraph-image`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="flex flex-1 flex-col text-foreground">
      <SiteHeader back={{ href: "/blog", label: "← All posts" }} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6">
        <article className="py-12 pb-24">
          <p className="mb-3 font-mono text-xs text-muted-foreground">
            <time dateTime={post.publishedAt?.toISOString()}>{postDate(post.publishedAt)}</time> · {readingMinutes(post.body)} min read
          </p>
          <h1 className="mb-5 text-4xl font-semibold tracking-tight text-balance md:text-5xl">{post.title}</h1>
          <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{post.summary}</p>
          {post.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- any size, any host
            <img src={post.coverImageUrl} alt="" className="mb-10 h-auto w-full rounded-lg border border-border" />
          )}
          <PostBody body={post.body} />
          {post.linkedinUrl && (
            <aside className="mt-14 flex flex-col gap-5 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{siteConfig.blog.discuss.heading}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{siteConfig.blog.discuss.text}</p>
              </div>
              <Button pixel asChild className="shrink-0 self-start sm:self-auto">
                <a href={post.linkedinUrl} target="_blank" rel="noopener noreferrer" data-ph-capture-attribute-link="blog-linkedin">
                  <SocialIcon label="LinkedIn" />
                  Comment on LinkedIn
                </a>
              </Button>
            </aside>
          )}
        </article>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        // "<" escaped, so the text cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
