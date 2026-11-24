"use client";

import { ExternalLink, PenLine, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { PostStatusPill } from "@/components/admin/post-status";
import { PostCover } from "@/components/post-cover";
import { SocialIcon } from "@/components/social-icon";
import { Button } from "@/components/ui/button";

import { deletePost } from "./actions";

type Row = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: "draft" | "published";
  coverImageUrl: string | null;
  linkedinUrl: string | null;
  date: string;
  minutes: number;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Live" },
  { key: "draft", label: "Drafts" },
] as const;

const icon = "flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50";

export function PostList({ posts }: { posts: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const count = (key: string) => (key === "all" ? posts.length : posts.filter((p) => p.status === key).length);
  const shown = posts.filter((p) => filter === "all" || p.status === filter);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
        <PenLine aria-hidden className="size-8 text-muted-foreground" />
        <p className="font-heading text-2xl font-semibold">Nothing written yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">Start with a rough draft. Nobody sees it until you publish.</p>
        <Button asChild>
          <Link href="/admin/posts/new">Write the first post</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 inline-flex gap-1 rounded-lg border border-border bg-card p-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1 text-sm font-medium ${filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f.label} <span className="font-mono text-xs opacity-70">{count(f.key)}</span>
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {shown.map((post) => (
          <li
            key={post.id}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors focus-within:border-link hover:border-link sm:flex-row"
          >
            <div className="h-32 shrink-0 overflow-hidden sm:h-auto sm:min-h-32 sm:w-52">
              <div className="h-full sm:absolute sm:inset-y-0 sm:left-0 sm:w-52">
                <PostCover src={post.coverImageUrl} seed={post.slug} />
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                <PostStatusPill status={post.status} />
                <span>{post.date}</span>
                <span>{post.minutes} min read</span>
              </div>
              <h2 className="text-xl leading-snug font-semibold text-balance">
                {/* Stretched over the card; the buttons sit above it. */}
                <Link href={`/admin/posts/${post.id}/edit`} className="outline-none after:absolute after:inset-0">
                  {post.title}
                </Link>
              </h2>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
            </div>
            <div className="relative z-10 flex items-center gap-1 self-end p-3 sm:self-center">
              {post.linkedinUrl && (
                <a href={post.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="On LinkedIn" title="On LinkedIn" className={icon}>
                  <SocialIcon label="LinkedIn" className="size-4" />
                </a>
              )}
              {post.status === "published" && (
                <a href={`/blog/${post.slug}`} target="_blank" aria-label="View on site" title="View on site" className={icon}>
                  <ExternalLink className="size-4" />
                </a>
              )}
              <button
                type="button"
                aria-label={`Delete ${post.title}`}
                title="Delete"
                disabled={isPending}
                className={`${icon} hover:text-destructive`}
                onClick={() => {
                  if (confirm(`Delete "${post.title}"? This can't be undone.`)) startTransition(() => deletePost(post.id));
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
        {shown.length === 0 && <li className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Nothing here.</li>}
      </ul>
    </div>
  );
}
