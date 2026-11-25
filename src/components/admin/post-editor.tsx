"use client";

import { ArrowLeft, ExternalLink, ImagePlus, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { generateCover, generateDraft, savePost, type GeneratedDraft, type SaveIntent } from "@/app/admin/(protected)/posts/actions";
import { CoverPanel } from "@/components/admin/cover-panel";
import { DraftPanel, type DraftRequest } from "@/components/admin/draft-panel";
import { LinkedInPanel } from "@/components/admin/linkedin-panel";
import { MarkdownEditor, type MarkdownEditorHandle } from "@/components/admin/markdown-editor";
import { MediaDialog } from "@/components/admin/media-dialog";
import { PostStatusPill } from "@/components/admin/post-status";
import { SidePanel } from "@/components/admin/side-panel";
import { TagInput } from "@/components/admin/tag-input";
import { useUnsavedGuard } from "@/components/admin/use-unsaved-guard";
import { PostCover } from "@/components/post-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify, SUMMARY_MAX, type CoverRequest, type PostInput, type PostStatus } from "@/lib/post-schema";
import { countWords, readingMinutes } from "@/lib/post-text";

/** The post as it is stored: `version` is its last change, to notice edits made elsewhere. */
type StoredPost = { id: string; status: PostStatus; slugLocked: boolean; slug: string; version: string };

type Props = {
  post: { stored: StoredPost; input: PostInput } | null;
  aiReady: boolean;
  coversReady: boolean;
  siteUrl: string;
};

const EMPTY: PostInput = { title: "", slug: "", summary: "", body: "", coverImageUrl: "", tags: [], linkedinUrl: "" };

export function PostEditor({ post, aiReady, coversReady, siteUrl }: Props) {
  const [stored, setStored] = useState<StoredPost | null>(post?.stored ?? null);
  const [input, setInput] = useState<PostInput>(post?.input ?? EMPTY);
  // What was last saved; anything different is unsaved.
  const [savedInput, setSavedInput] = useState<PostInput>(post?.input ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [view, setView] = useState<"write" | "markdown">("write");
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const [saving, startSaving] = useTransition();
  const [drafting, startDrafting] = useTransition();
  const [drawing, startDrawing] = useTransition();
  // The scene to draw: suggested by the draft or the last cover, and editable.
  const [coverIdea, setCoverIdea] = useState("");
  // An AI draft that arrived after the post was edited, waiting for a decision.
  const [waitingDraft, setWaitingDraft] = useState<{ draft: GeneratedDraft; withCover: boolean } | null>(null);
  // Bumped to reload the editor when the text is replaced from outside it.
  const [editorKey, setEditorKey] = useState(0);
  const [coverOpen, setCoverOpen] = useState(false);
  const editor = useRef<MarkdownEditorHandle>(null);
  const latest = useRef(input);

  const status = stored?.status ?? "draft";
  const live = status === "published";
  const busy = saving || drafting || drawing;
  const canDraw = !busy && input.title.trim() !== "";
  const dirty = JSON.stringify(input) !== JSON.stringify(savedInput);
  useUnsavedGuard(dirty);

  function set(patch: Partial<PostInput>) {
    latest.current = { ...latest.current, ...patch };
    setInput(latest.current);
  }

  // The editor reports changes with a short delay; this is the text right now.
  const currentInput = (): PostInput => ({ ...latest.current, body: editor.current?.getMarkdown() ?? latest.current.body });

  function save(intent: SaveIntent) {
    if (busy) return;
    if (intent === "publish" && !confirm("Publish this post on the site?")) return;
    setMessage(null);
    startSaving(async () => {
      const sent = currentInput();
      const bodyBefore = latest.current.body;
      let result = await savePost(stored && { id: stored.id, version: stored.version }, sent, intent);
      if (!result.ok && result.conflict) {
        const overwrite = confirm(
          "This post was changed somewhere else since you opened it (another tab, or an agent).\n\nOK: save yours over it.\nCancel: keep yours here, unsaved.",
        );
        if (overwrite) result = await savePost(stored && { id: stored.id, version: result.conflict }, sent, intent);
      }
      if (!result.ok) return setMessage({ error: true, text: result.error });

      // Typing may have gone on meanwhile: that stays, as unsaved.
      setSavedInput(sent);
      if (latest.current.body === bodyBefore) set({ body: sent.body });
      setStored(result.post);
      setMessage({ error: false, text: result.post.status === "published" ? "Saved. The post is live." : "Draft saved." });
      // The first save gets its own address, without reloading the editor.
      if (!stored) window.history.replaceState(null, "", `/admin/posts/${result.post.id}/edit`);
    });
  }

  function drawCover(request: CoverRequest, done = "") {
    startDrawing(async () => {
      setMessage({ error: false, text: `${done}Drawing the cover…` });
      const result = await generateCover(request);
      if (!result.ok) return setMessage({ error: true, text: `${done}${result.error}` });
      set({ coverImageUrl: result.url });
      setCoverIdea(result.idea);
      const cost = result.cost === null ? "" : ` It cost $${result.cost.toFixed(3)}.`;
      setMessage({ error: false, text: `${done}Cover ready.${cost}` });
    });
  }

  const drawScene = (idea: string) => drawCover({ title: input.title, summary: input.summary, idea });

  function applyDraft(draft: GeneratedDraft, withCover: boolean) {
    const { slug, coverIdea: idea, ...text } = draft;
    setWaitingDraft(null);
    setCoverIdea(idea);
    set(stored?.slugLocked ? text : { ...text, slug });
    setEditorKey((k) => k + 1);
    const done = "Draft ready. Check every fact, and resolve any [TODO] before publishing. ";
    if (withCover) drawCover({ title: text.title, summary: text.summary, idea }, done);
    else setMessage({ error: false, text: done });
  }

  function draft({ topic, notes, withCover }: DraftRequest) {
    const before = currentInput();
    const hasText = [before.title, before.summary, before.body].some((t) => t.trim()) || before.tags.length > 0;
    if (hasText && !confirm("Replace the title, summary, tags, address and text with a new AI draft?")) return;
    setMessage(null);
    setWaitingDraft(null);
    startDrafting(async () => {
      const result = await generateDraft(topic, notes);
      if (!result.ok) return setMessage({ error: true, text: result.error });
      if (JSON.stringify(currentInput()) === JSON.stringify(before)) return applyDraft(result.draft, withCover);
      setWaitingDraft({ draft: result.draft, withCover });
      setMessage({ error: false, text: "The AI draft is ready, but you edited the post meanwhile. Your text is untouched." });
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
            {countWords(input.body)} words · {readingMinutes(input.body)} min
          </span>
          <span className="text-xs text-muted-foreground">{saving ? "Saving…" : dirty ? "Unsaved changes" : ""}</span>
          <div className="ml-auto flex items-center gap-2">
            {live && (
              <>
                <a href={`/blog/${stored!.slug}`} target="_blank" aria-label="View on site" title="View on site" className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
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
        {waitingDraft && (
          <div className="flex gap-2 pb-3">
            <Button type="button" size="sm" disabled={busy} onClick={() => applyDraft(waitingDraft.draft, waitingDraft.withCover)}>
              Replace with the draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="neutral"
              onClick={() => {
                setWaitingDraft(null);
                setMessage(null);
              }}
            >
              Keep mine
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 rounded-xl border border-border bg-card">
          {input.coverImageUrl ? (
            <div className="group relative aspect-[21/9] overflow-hidden rounded-t-xl border-b border-border">
              <PostCover src={input.coverImageUrl} seed={input.slug} />
              <div className="absolute top-3 right-3 flex gap-2">
                {coversReady && (
                  <Button type="button" size="sm" variant="neutral" disabled={!canDraw} onClick={() => drawScene(coverIdea)}>
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
                  disabled={!canDraw}
                  title={input.title.trim() ? "Paid, usually a few cents" : "Add a title first"}
                  onClick={() => drawScene(coverIdea)}
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
                    set({ body: currentInput().body });
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
                disabled={stored?.slugLocked}
                className="font-mono text-xs"
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: e.target.value });
                }}
              />
              <p className="font-mono text-xs break-all text-muted-foreground">
                {stored?.slugLocked ? "Fixed once published" : `/blog/${input.slug || "…"}`}
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

          {coversReady && <CoverPanel idea={coverIdea} disabled={!canDraw} drawing={drawing} onIdea={setCoverIdea} onDraw={drawScene} />}
          <DraftPanel open={!post && aiReady} aiReady={aiReady} coversReady={coversReady} busy={busy} drafting={drafting} onDraft={draft} />
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
