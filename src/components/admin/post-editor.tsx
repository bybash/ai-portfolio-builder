"use client";

import { ArrowLeft, ChevronDown, ExternalLink, ImagePlus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { generateCover, generateDraft, savePost } from "@/app/admin/(protected)/posts/actions";
import { LinkedInPanel } from "@/components/admin/linkedin-panel";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/admin/markdown-editor";
import { MediaDialog } from "@/components/admin/media-dialog";
import { PostStatusPill } from "@/components/admin/post-status";
import { TagInput } from "@/components/admin/tag-input";
import { PostCover } from "@/components/post-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify, type PostInput } from "@/lib/post-schema";

type Props = {
  post: { id: string; status: "draft" | "published"; slugLocked: boolean; input: PostInput } | null;
  aiReady: boolean;
  coversReady: boolean;
  siteUrl: string;
};

const EMPTY: PostInput = { title: "", slug: "", summary: "", body: "", coverImageUrl: "", tags: [], linkedinUrl: "" };
const area = "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm";
const SUMMARY_MAX = 300;

function SidePanel({ title, icon, open, children }: { title: string; icon?: React.ReactNode; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {icon}
        {title}
        <ChevronDown aria-hidden className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-4">{children}</div>
    </details>
  );
}

export function PostEditor({ post, aiReady, coversReady, siteUrl }: Props) {
  const router = useRouter();
  const [input, setInput] = useState<PostInput>(post?.input ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState<"write" | "markdown">("write");
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, startSaving] = useTransition();
  const [drafting, startDrafting] = useTransition();
  const [drawing, startDrawing] = useTransition();
  const [withCover, setWithCover] = useState(false);
  // The scene to draw: suggested by the draft or the last cover, and editable.
  const [coverIdea, setCoverIdea] = useState("");
  // Bumped to reload the editor when the text is replaced from outside it.
  const [editorKey, setEditorKey] = useState(0);
  const editor = useRef<MarkdownEditorHandle>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const status = post?.status ?? "draft";
  const live = status === "published";
  const busy = saving || drafting || drawing;
  const words = input.body.trim() ? input.body.trim().split(/\s+/).length : 0;

  // A tab close or reload must not lose unsaved writing.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set(patch: Partial<PostInput>) {
    setInput((v) => ({ ...v, ...patch }));
    setDirty(true);
  }

  // The editor reports changes with a short delay; this is the text right now.
  const currentBody = () => editor.current?.getMarkdown() ?? input.body;

  function save(intent: "save" | "publish" | "unpublish") {
    if (busy) return;
    if (intent === "publish" && !confirm("Publish this post on the site?")) return;
    setMessage(null);
    const body = currentBody();
    startSaving(async () => {
      const result = await savePost(post?.id ?? null, { ...input, body }, intent);
      if (!result.ok) return setMessage({ error: true, text: result.error });
      setInput((v) => ({ ...v, body }));
      setDirty(false);
      setMessage({ error: false, text: result.status === "published" ? "Saved. The post is live." : "Draft saved." });
      if (post) router.refresh();
      else router.replace(`/admin/posts/${result.id}/edit`);
    });
  }

  function drawCover(from: { title: string; summary: string; idea: string }, done = "") {
    startDrawing(async () => {
      setMessage({ error: false, text: `${done}Drawing the cover…` });
      const result = await generateCover(from);
      if (!result.ok) return setMessage({ error: true, text: `${done}${result.error}` });
      set({ coverImageUrl: result.url });
      setCoverIdea(result.idea);
      const cost = result.cost === null ? "" : ` It cost $${result.cost.toFixed(3)}.`;
      setMessage({ error: false, text: `${done}Cover ready.${cost}` });
    });
  }

  function draft() {
    if (currentBody().trim() && !confirm("Replace the current text with a new AI draft?")) return;
    setMessage(null);
    startDrafting(async () => {
      const result = await generateDraft(topic, notes);
      if (!result.ok) return setMessage({ error: true, text: result.error });
      const { slug, coverIdea: idea, ...rest } = result.draft;
      setCoverIdea(idea);
      set(post?.slugLocked ? rest : { ...rest, slug });
      setEditorKey((k) => k + 1);
      const done = "Draft ready. Check every fact, and resolve any [TODO] before publishing. ";
      if (withCover && coversReady) drawCover({ title: rest.title, summary: rest.summary, idea }, done);
      else setMessage({ error: false, text: done });
    });
  }

  return (
    <div
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "s") {
          e.preventDefault();
          save("save");
        }
      }}
    >
      <div className="post-actions sticky top-0 z-20 -mx-6 -mt-10 mb-6 border-b border-border bg-background/90 px-6 backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 py-2">
          <Link href="/admin/posts" aria-label="All posts" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <PostStatusPill status={status} />
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
            {words} words · {Math.max(1, Math.round(words / 220))} min
          </span>
          <span className="text-xs text-muted-foreground">{saving ? "Saving…" : dirty ? "Unsaved changes" : ""}</span>
          <div className="ml-auto flex items-center gap-2">
            {live && (
              <>
                <a href={`/blog/${post!.input.slug}`} target="_blank" aria-label="View on site" title="View on site" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                  <ExternalLink className="size-4" />
                </a>
                <Button type="button" size="sm" disabled={busy} variant="neutral" onClick={() => save("unpublish")}>
                  Unpublish
                </Button>
              </>
            )}
            <Button type="button" size="sm" disabled={busy} variant={live ? "default" : "neutral"} title="⌘S" onClick={() => save("save")}>
              {live ? "Update" : "Save draft"}
            </Button>
            {!live && (
              <Button type="button" size="sm" disabled={busy} onClick={() => save("publish")}>
                Publish
              </Button>
            )}
          </div>
        </div>
        <p aria-live="polite" className={`text-sm empty:hidden ${message?.error ? "pb-3 font-medium text-destructive" : "pb-3 text-muted-foreground"}`}>
          {message?.text}
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 rounded-xl border border-border bg-card">
          {input.coverImageUrl ? (
            <div className="group relative aspect-[21/9] overflow-hidden rounded-t-xl border-b border-border">
              <PostCover src={input.coverImageUrl} seed={input.slug} />
              <div className="absolute top-3 right-3 flex gap-2">
                {coversReady && (
                  <Button type="button" size="sm" variant="neutral" disabled={busy || !input.title.trim()} onClick={() => drawCover({ title: input.title, summary: input.summary, idea: coverIdea })}>
                    <Sparkles /> {drawing ? "Drawing…" : "New with AI"}
                  </Button>
                )}
                <Button type="button" size="sm" variant="neutral" onClick={() => setCoverOpen(true)}>
                  Change
                </Button>
                <Button type="button" size="sm" variant="neutral" aria-label="Remove cover" onClick={() => set({ coverImageUrl: "" })}>
                  <X />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-5 px-6 pt-5 sm:px-18">
              <button type="button" onClick={() => setCoverOpen(true)} className="inline-flex items-center gap-2 rounded-lg py-1 text-sm text-muted-foreground hover:text-foreground">
                <ImagePlus className="size-4" /> Add a cover
              </button>
              {coversReady && (
                <button
                  type="button"
                  disabled={busy || !input.title.trim()}
                  title={input.title.trim() ? "Paid, usually a few cents" : "Add a title first"}
                  onClick={() => drawCover({ title: input.title, summary: input.summary, idea: coverIdea })}
                  className="inline-flex items-center gap-2 rounded-lg py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Sparkles className="size-4" /> {drawing ? "Drawing…" : "Make one with AI"}
                </button>
              )}
            </div>
          )}

          <div className="px-6 pt-4 pb-6 sm:px-18">
            <textarea
              id="title"
              aria-label="Title"
              rows={1}
              value={input.title}
              placeholder="Post title"
              onChange={(e) => {
                const title = e.target.value.replace(/\n/g, " ");
                set({ title, ...(!slugTouched && { slug: slugify(title) }) });
              }}
              className="field-sizing-content w-full resize-none bg-transparent font-heading text-4xl leading-tight font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 md:text-5xl"
            />
            <textarea
              id="summary"
              aria-label="Summary"
              rows={1}
              value={input.summary}
              placeholder="A one-sentence summary, for search results and share cards"
              onChange={(e) => set({ summary: e.target.value.replace(/\n/g, " ") })}
              className="field-sizing-content mt-3 w-full resize-none bg-transparent text-lg leading-relaxed text-muted-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="border-t border-border">
            {view === "write" ? (
              <MarkdownEditor key={editorKey} ref={editor} initialValue={input.body} onChange={(body) => set({ body })} />
            ) : (
              <textarea
                aria-label="Post text (Markdown)"
                value={input.body}
                onChange={(e) => set({ body: e.target.value })}
                className="min-h-[65vh] w-full resize-y bg-transparent px-6 py-6 font-mono text-sm leading-relaxed outline-none sm:px-18"
              />
            )}
            <div className="flex justify-end border-t border-border px-4 py-2">
              <button
                type="button"
                className="font-mono text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (view === "write") {
                    setInput((v) => ({ ...v, body: currentBody() }));
                    setView("markdown");
                  } else setView("write");
                }}
              >
                {view === "write" ? "Edit as Markdown" : "Back to the editor"}
              </button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <SidePanel title="Details" open>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tags">Tags</Label>
              <TagInput id="tags" value={input.tags} onChange={(tags) => set({ tags })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">Address</Label>
              <Input
                id="slug"
                value={input.slug}
                disabled={post?.slugLocked}
                className="font-mono text-xs"
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value });
                }}
              />
              <p className="font-mono text-xs break-all text-muted-foreground">
                {post?.slugLocked ? "Fixed once published" : `/blog/${input.slug || "…"}`}
              </p>
            </div>
          </SidePanel>

          <SidePanel title="Preview" open>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-[16/9] border-b border-border">
                <PostCover src={input.coverImageUrl || null} seed={input.slug} />
              </div>
              <div className="p-3">
                <p className="font-heading leading-snug font-semibold">{input.title || "Post title"}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{input.summary || "The summary shows here."}</p>
              </div>
            </div>
            <p className={`text-xs ${input.summary.length > SUMMARY_MAX ? "font-bold text-destructive" : "text-muted-foreground"}`}>
              Summary: {input.summary.length} of {SUMMARY_MAX} characters
            </p>
          </SidePanel>

          {coversReady && (
            <SidePanel title="Cover with AI" icon={<ImagePlus aria-hidden className="size-4 text-link" />}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cover-idea">Scene</Label>
                <textarea
                  id="cover-idea"
                  value={coverIdea}
                  maxLength={1000}
                  onChange={(e) => setCoverIdea(e.target.value)}
                  placeholder="Describe the picture, or leave empty for a suggestion"
                  className={`${area} min-h-28`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={busy || !input.title.trim()} onClick={() => drawCover({ title: input.title, summary: input.summary, idea: coverIdea })}>
                  {drawing ? "Drawing…" : "Draw this"}
                </Button>
                <Button type="button" size="sm" variant="neutral" disabled={busy || !input.title.trim()} onClick={() => drawCover({ title: input.title, summary: input.summary, idea: "" })}>
                  New scene
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Paid, usually a few cents each time.</p>
            </SidePanel>
          )}

          <SidePanel title="Draft with AI" icon={<Sparkles aria-hidden className="size-4 text-link" />} open={!post && aiReady}>
            {aiReady ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Your points and facts</Label>
                  <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={`${area} min-h-28`} />
                </div>
                {coversReady && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={withCover} onChange={(e) => setWithCover(e.target.checked)} className="size-4 accent-primary" />
                    Also make a cover <span className="text-muted-foreground">(paid, a few cents)</span>
                  </label>
                )}
                <Button type="button" size="sm" onClick={draft} disabled={busy || topic.trim().length < 3}>
                  {drafting ? "Drafting…" : "Write a draft"}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Set AI_API_KEY to turn this on. Writing by hand works without it.</p>
            )}
          </SidePanel>

        </aside>
      </div>

      {live && (
        <div className="mt-8">
          <LinkedInPanel input={input} siteUrl={siteUrl} onLink={(linkedinUrl) => set({ linkedinUrl })} />
        </div>
      )}

      {coverOpen && (
        <MediaDialog
          request={{ kind: "image" }}
          onClose={() => setCoverOpen(false)}
          onInsert={(result) => {
            if (result.kind === "image") set({ coverImageUrl: result.src });
            setCoverOpen(false);
          }}
        />
      )}
    </div>
  );
}
