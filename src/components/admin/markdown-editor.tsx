"use client";

import "@milkdown/crepe/theme/common/reset.css";
import "@milkdown/crepe/theme/common/prosemirror.css";
import "@milkdown/crepe/theme/common/block-edit.css";
import "@milkdown/crepe/theme/common/code-mirror.css";
import "@milkdown/crepe/theme/common/cursor.css";
import "@milkdown/crepe/theme/common/link-tooltip.css";
import "@milkdown/crepe/theme/common/list-item.css";
import "@milkdown/crepe/theme/common/placeholder.css";
import "@milkdown/crepe/theme/common/table.css";
import "@milkdown/crepe/theme/common/toolbar.css";
import "@milkdown/crepe/theme/common/top-bar.css";
import "./markdown-editor.css";

import type { Crepe } from "@milkdown/crepe";
import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorView } from "@milkdown/kit/prose/view";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { MediaDialog, type MediaRequest, type MediaResult } from "@/components/admin/media-dialog";

export type MarkdownEditorHandle = { getMarkdown: () => string | undefined };

const IMAGE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="fill:none"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5L6 20"/></svg>';

const VIDEO_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="fill:none"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>';

const imageFiles = (data: DataTransfer | null) => [...(data?.files ?? [])].filter((f) => f.type.startsWith("image/"));

// Milkdown writes blank lines as <br />, which the site would show as text.
const clean = (markdown: string) => markdown.replace(/^<br \/>\n?/gm, "").replace(/\n{3,}/g, "\n\n").trim();

// A WYSIWYG editor (Milkdown Crepe) that reads and writes Markdown. It owns the
// text after mounting: change its `key` to load new text.
export function MarkdownEditor({
  ref,
  initialValue,
  onChange,
}: {
  ref: Ref<MarkdownEditorHandle>;
  initialValue: string;
  onChange: (markdown: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Crepe | null>(null);
  const initial = useRef(initialValue);
  const latestOnChange = useRef(onChange);
  const view = useRef<EditorView | null>(null);
  const [failed, setFailed] = useState(false);
  // Images and videos waiting to be added, one dialog at a time.
  const [queue, setQueue] = useState<{ id: number; request: MediaRequest }[]>([]);
  const nextId = useRef(0);

  function ask(...requests: MediaRequest[]) {
    setQueue((q) => [...q, ...requests.map((request) => ({ id: nextId.current++, request }))]);
  }
  const askRef = useRef(ask);

  function insertMedia(result: MediaResult) {
    const editor = view.current;
    if (editor) {
      const { schema, tr } = editor.state;
      const content =
        result.kind === "image"
          ? schema.nodes.image.create({ src: result.src, alt: result.alt })
          : schema.text(result.url, [schema.marks.link.create({ href: result.url })]);
      // In a paragraph of its own.
      const node = schema.nodes.paragraph.create(null, content);
      editor.dispatch(tr.replaceSelectionWith(node, false).scrollIntoView());
    }
    setQueue((q) => q.slice(1));
  }

  useEffect(() => {
    latestOnChange.current = onChange;
  });

  useImperativeHandle(ref, () => ({
    // Undefined until it has loaded, so the caller keeps the text it has.
    getMarkdown: () => (instance.current ? clean(instance.current.getMarkdown()) : undefined),
  }));

  useEffect(() => {
    let cancelled = false;
    let crepe: Crepe | null = null;
    const root = document.createElement("div");
    host.current?.append(root);

    // Pasted or dropped image files: ask for a description, then upload.
    // Listens before the editor does, which would otherwise ignore them.
    const onPaste = (e: ClipboardEvent) => {
      const files = imageFiles(e.clipboardData);
      // Text copied from an office app carries a picture of itself: keep the text.
      if (files.length === 0 || e.clipboardData?.getData("text/plain")) return;
      e.preventDefault();
      e.stopPropagation();
      askRef.current(...files.map((file): MediaRequest => ({ kind: "image", file })));
    };
    const onDrop = async (e: DragEvent) => {
      const files = imageFiles(e.dataTransfer);
      if (files.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      const { clientX: left, clientY: top } = e;
      const { TextSelection } = await import("@milkdown/kit/prose/state");
      const at = view.current?.posAtCoords({ left, top });
      if (view.current && at) {
        const { doc, tr } = view.current.state;
        view.current.dispatch(tr.setSelection(TextSelection.near(doc.resolve(at.pos))));
      }
      askRef.current(...files.map((file): MediaRequest => ({ kind: "image", file })));
    };
    root.addEventListener("paste", onPaste, true);
    root.addEventListener("drop", onDrop, true);

    (async () => {
      const [{ Crepe: Editor }, { commandsCtx, editorViewCtx }, { clearTextInCurrentBlockCommand }, { youtubePreview }] = await Promise.all([
        import("@milkdown/crepe"),
        import("@milkdown/kit/core"),
        import("@milkdown/kit/preset/commonmark"),
        import("@/components/admin/youtube-preview"),
      ]);
      if (cancelled) return;
      const askFromMenu = (ctx: Ctx, kind: "image" | "video") => {
        // Removes the "/" that opened the menu.
        ctx.get(commandsCtx).call(clearTextInCurrentBlockCommand.key);
        askRef.current({ kind });
      };
      crepe = new Editor({
        root,
        defaultValue: initial.current,
        features: {
          [Editor.Feature.Latex]: false,
          [Editor.Feature.TopBar]: true,
          // Crepe's own image block keeps a size in the alt text. Plain
          // Markdown images keep their description (added to the menu below).
          [Editor.Feature.ImageBlock]: false,
        },
        featureConfigs: {
          [Editor.Feature.Placeholder]: { text: "Write, or type / for blocks" },
          // The page title is the only h1, so posts use two heading levels.
          [Editor.Feature.BlockEdit]: {
            textGroup: { h1: null, h4: null, h5: null, h6: null },
            buildMenu: (menu) =>
              menu
                .addGroup("media", "Media")
                .addItem("image", { label: "Image", icon: IMAGE_ICON, onRun: (ctx: Ctx) => askFromMenu(ctx, "image") })
                .addItem("video", { label: "YouTube video", icon: VIDEO_ICON, onRun: (ctx: Ctx) => askFromMenu(ctx, "video") }),
          },
          [Editor.Feature.TopBar]: {
            headingOptions: [
              { label: "Text", level: null },
              { label: "Heading", level: 2 },
              { label: "Subheading", level: 3 },
            ],
            buildTopBar: (bar) =>
              bar
                .addGroup("media", "Media")
                .addItem("image", { icon: IMAGE_ICON, active: () => false, onRun: () => askRef.current({ kind: "image" }) })
                .addItem("video", { icon: VIDEO_ICON, active: () => false, onRun: () => askRef.current({ kind: "video" }) }),
          },
        },
      });
      crepe.on((listener) => {
        listener.markdownUpdated((_ctx, markdown, previous) => {
          if (!cancelled && markdown !== previous) latestOnChange.current(clean(markdown));
        });
      });
      crepe.editor.use(youtubePreview);
      await crepe.create();
      if (cancelled) await crepe.destroy();
      else {
        instance.current = crepe;
        view.current = crepe.editor.ctx.get(editorViewCtx);
      }
    })().catch((e) => {
      console.error("The editor did not load", e);
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      // Still loading: the async block above destroys it once created.
      if (instance.current) void instance.current.destroy();
      instance.current = null;
      view.current = null;
      root.remove();
    };
  }, []);

  return (
    <div className="post-editor">
      {failed && <p className="p-4 text-sm text-destructive">The editor did not load. Use “Edit as Markdown” above.</p>}
      <div ref={host} />
      {queue[0] && (
        <MediaDialog key={queue[0].id} request={queue[0].request} onInsert={insertMedia} onClose={() => setQueue((q) => q.slice(1))} />
      )}
    </div>
  );
}
