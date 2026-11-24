"use client";

import { useRef, useState } from "react";

import { PostCopySource } from "@/components/post-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postImages } from "@/lib/post-images";
import type { PostInput } from "@/lib/post-schema";

// Puts an image on the clipboard. Browsers only accept PNG there.
async function copyImage(src: string) {
  const png = (async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error("not found");
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png"));
  })();
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

export function LinkedInPanel({
  input,
  siteUrl,
  onLink,
}: {
  input: PostInput;
  siteUrl: string;
  onLink: (url: string) => void;
}) {
  const source = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const url = `${siteUrl}/blog/${input.slug}`;
  const images = postImages(input.body).map((image, i) => ({ ...image, label: `Image ${i + 1}` }));
  const all = input.coverImageUrl ? [{ src: input.coverImageUrl, alt: "", label: "Cover" }, ...images] : images;

  async function run(action: () => Promise<void>, done: string, failed = "The browser blocked copying. Click on the page and try again.") {
    try {
      await action();
      setMessage({ error: false, text: done });
    } catch {
      setMessage({ error: true, text: failed });
    }
  }

  const copyArticle = () =>
    run(
      () =>
        navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([source.current!.innerHTML], { type: "text/html" }),
            "text/plain": new Blob([source.current!.innerText], { type: "text/plain" }),
          }),
        ]),
      "Article copied. Paste it into LinkedIn's editor.",
    );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">LinkedIn article</h2>
      <p className="text-sm text-muted-foreground">
        LinkedIn has no way to publish articles from outside, so this is copy and paste. It ends with a link to the original here.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="neutral" asChild>
          <a href="https://www.linkedin.com/article/new/" target="_blank" rel="noopener noreferrer">
            1. Open LinkedIn&apos;s editor
          </a>
        </Button>
        <Button type="button" variant="neutral" onClick={() => run(() => navigator.clipboard.writeText(input.title), "Title copied.")}>
          2. Copy title
        </Button>
        <Button type="button" variant="neutral" onClick={copyArticle}>
          3. Copy article
        </Button>
      </div>

      {all.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-bold">4. Add the images.</span>{" "}
            <span className="text-muted-foreground">
              LinkedIn doesn&apos;t load images from links. The copied text has a marker like [Image 1] where each one goes: replace it by pasting the image, or download it and upload it there.
            </span>
          </p>
          <ul className="flex flex-col gap-2">
            {all.map((image, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- any size, any host */}
                <img src={image.src} alt="" className="size-12 rounded border border-border object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="font-bold">{image.label}</span> {image.alt}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="neutral"
                  onClick={() =>
                    run(
                      () => copyImage(image.src),
                      `${image.label} copied.`,
                      "Could not copy this image. Download it instead, then upload it in LinkedIn.",
                    )
                  }
                >
                  Copy
                </Button>
                <Button size="sm" variant="neutral" asChild>
                  <a href={image.src} download={`${input.slug}-${image.label.toLowerCase().replace(" ", "-")}`} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p aria-live="polite" className={`text-sm ${message?.error ? "font-bold text-destructive" : "text-muted-foreground"}`}>
        {message?.text}
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="linkedin">Once published there, paste the article&apos;s link and update the post</Label>
        <Input id="linkedin" value={input.linkedinUrl} onChange={(e) => onLink(e.target.value)} placeholder="https://www.linkedin.com/pulse/…" />
      </div>

      <div ref={source} className="sr-only" aria-hidden="true" inert>
        <PostCopySource body={input.body} siteUrl={siteUrl} />
        <p>
          Originally published at <a href={url}>{url}</a>
        </p>
      </div>
    </section>
  );
}
