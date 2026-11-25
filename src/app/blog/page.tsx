import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PostCover } from "@/components/post-cover";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/config";
import { publishedPosts } from "@/lib/posts";
import { postDate, readingMinutes } from "@/lib/post-text";
import { getFeatures } from "@/lib/site-settings";

// Rendered per request, so `next build` never needs a database.
export const dynamic = "force-dynamic";

const { blog, person } = siteConfig;
const title = `${blog.heading} | ${person.name}`;

export const metadata: Metadata = {
  title,
  description: blog.intro,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { title, description: blog.intro, url: "/blog", type: "website" },
  twitter: { card: "summary_large_image", title, description: blog.intro },
};

export default async function BlogPage() {
  if (!(await getFeatures()).blog) notFound();
  const posts = await publishedPosts();

  return (
    <div className="flex flex-1 flex-col text-foreground">
      <SiteHeader active="blog" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
        <section className="py-12">
          <h1 className="text-4xl font-semibold tracking-tight">{blog.heading}</h1>
          <p className="mt-3 max-w-lg text-muted-foreground">{blog.intro}</p>
          <a href="/blog/rss.xml" className="mt-3 inline-block font-mono text-xs text-muted-foreground underline underline-offset-4">
            RSS feed
          </a>
        </section>
        <section className="pb-24">
          {posts.length === 0 && <p className="text-muted-foreground">No posts yet. The first one is on its way.</p>}
          <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
            {posts.map((post, i) => (
              <article
                key={post.id}
                // The newest post leads, across the full width.
                className={`group relative ${i === 0 ? "grid items-center gap-6 md:col-span-2 md:grid-cols-[1.35fr_1fr] md:gap-10 md:pb-6" : "flex flex-col gap-5"}`}
              >
                <div className="aspect-[16/9] overflow-hidden rounded-xl border border-border">
                  <PostCover
                    src={post.coverImageUrl}
                    seed={post.slug}
                    className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {i === 0 && <span className="text-link">Latest · </span>}
                    <time dateTime={post.publishedAt?.toISOString()}>{postDate(post.publishedAt)}</time> · {readingMinutes(post.body)} min read
                  </p>
                  <h2 className={`mt-2 leading-tight font-semibold text-balance ${i === 0 ? "text-3xl md:text-4xl" : "text-2xl"}`}>
                    <Link href={`/blog/${post.slug}`} className="group-hover:underline after:absolute after:inset-0">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 leading-relaxed text-foreground/80">{post.summary}</p>
                  {post.tags.length > 0 && <p className="mt-4 font-mono text-xs text-muted-foreground">{post.tags.map((t) => `#${t}`).join("  ")}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
