"use client";

import { useEffect, useRef, useState } from "react";

import { uploadImage } from "@/components/admin/upload-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { youtubeId } from "@/lib/youtube";

export type MediaRequest = { kind: "image"; file?: File } | { kind: "video" };
export type MediaResult = { kind: "image"; src: string; alt: string } | { kind: "video"; url: string };

// Asks for an image (a file or an address, and its description) or a YouTube address.
export function MediaDialog({
  request,
  onInsert,
  onClose,
}: {
  request: MediaRequest;
  onInsert: (result: MediaResult) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(request.kind === "image" ? (request.file ?? null) : null);
  const [address, setAddress] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  async function insert() {
    setError("");
    const url = address.trim();
    if (request.kind === "video") {
      if (!youtubeId(url)) return setError("That is not a YouTube video address.");
      return onInsert({ kind: "video", url });
    }
    if (!file && !/^(https:\/\/\S+|\/(?!\/)\S+)$/.test(url)) {
      return setError("Choose a file, or use an https:// address or a /path on this site.");
    }
    setBusy(true);
    try {
      onInsert({ kind: "image", src: file ? await uploadImage(file) : url, alt: alt.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload failed.");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="media-dialog-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-border bg-card p-6 text-foreground backdrop:bg-black/40"
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void insert();
        }}
      >
        <h2 id="media-dialog-title" className="text-xl font-semibold">
          {request.kind === "image" ? "Add an image" : "Add a YouTube video"}
        </h2>
        {request.kind === "image" && (
          <>
            <Label htmlFor="media-file">From your computer</Label>
            {request.file ? (
              <p className="text-sm text-muted-foreground">{request.file.name}</p>
            ) : (
              <input
                id="media-file"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-muted file:px-3 file:py-1.5"
              />
            )}
          </>
        )}
        {!file && (
          <>
            <Label htmlFor="media-address">{request.kind === "image" ? "Or an image address" : "Video address"}</Label>
            <Input id="media-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={request.kind === "video" ? "https://www.youtube.com/watch?v=…" : "https://…"} />
          </>
        )}
        {request.kind === "image" && (
          <>
            <Label htmlFor="media-alt">Description, for people who can&apos;t see it</Label>
            <Input id="media-alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm font-bold text-destructive">
            {error}
          </p>
        )}
        <div className="mt-2 flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Insert"}
          </Button>
          <Button type="button" variant="neutral" onClick={() => dialog.current?.close()}>
            Cancel
          </Button>
        </div>
      </form>
    </dialog>
  );
}
