"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetSettings, saveSettings } from "@/app/admin/(protected)/settings/actions";
import { PixelLogo } from "@/components/pixel-logo-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PixelLogoConfig } from "@/lib/pixel-logo";

const MAX = 32;

// Draws the pixel logo (person.logoPixel): click or drag over the grid to fill
// or clear pixels, pick the colours that step diagonally across it, and the
// extrusion depth. The previews use the same component as the site header.
// `starterColors` (the theme's accents) fill a new logo; `previewBackgrounds`
// are the light and dark theme backgrounds the previews sit on.
export function PixelLogoEditor({
  initial,
  saved,
  starterColors,
  previewBackgrounds,
}: {
  initial: PixelLogoConfig | null;
  saved: boolean;
  starterColors: string[];
  previewBackgrounds: { light: string; dark: string | null };
}) {
  const start = initial ?? { rows: Array.from({ length: 12 }, () => ".".repeat(12)), colors: starterColors, depth: 2 };
  const [enabled, setEnabled] = useState(initial !== null);
  const [rows, setRows] = useState<string[]>(normalise(start.rows));
  const [colors, setColors] = useState<string[]>(start.colors);
  const [depth, setDepth] = useState(start.depth ?? 0);
  const [paint, setPaint] = useState<"#" | "." | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const width = rows[0]?.length ?? 0;
  const height = rows.length;

  const setCell = (x: number, y: number, v: "#" | ".") =>
    setRows((prev) => prev.map((row, j) => (j === y ? row.slice(0, x) + v + row.slice(x + 1) : row)));

  const resize = (w: number, h: number) => {
    w = clamp(w, 1, MAX);
    h = clamp(h, 1, MAX);
    setRows((prev) =>
      Array.from({ length: h }, (_, y) => (prev[y] ?? "").padEnd(w, ".").slice(0, w)),
    );
  };

  const run = (action: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    startTransition(async () => {
      setMessage(null);
      try {
        const result = await action();
        setMessage(result.ok ? { ok: true, text: done } : { ok: false, text: result.error ?? "Could not save." });
        if (result.ok) router.refresh();
      } catch {
        setMessage({ ok: false, text: "Could not save. Is your admin session still valid?" });
      }
    });

  const logo = { rows, colors, depth };
  const hasPixels = rows.some((r) => r.includes("#"));

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-brutal-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Pixel logo</h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Drawn in the header and footer, and used for the favicon, the app icons and the share image. Without it,
            the site shows the logo image from site.config.ts (person.logo), or the first initial.
          </p>
        </div>
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {saved ? "Saved in admin" : "From site.config.ts"}
        </span>
      </div>

      <label className="mb-5 flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4" />
        Use a pixel logo
      </label>

      {enabled && (
        <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-end gap-4">
              <NumberField label="Width" value={width} min={1} max={MAX} onChange={(w) => resize(w, height)} />
              <NumberField label="Height" value={height} min={1} max={MAX} onChange={(h) => resize(width, h)} />
              <NumberField label="Depth" value={depth} min={0} max={6} onChange={(d) => setDepth(clamp(d, 0, 6))} />
              <Button type="button" variant="neutral" size="sm" onClick={() => setRows(rows.map((r) => r.slice(0, Math.ceil(width / 2)) + [...r.slice(0, Math.floor(width / 2))].reverse().join("")))}>
                Mirror left to right
              </Button>
              <Button type="button" variant="neutral" size="sm" onClick={() => setRows(rows.map((r) => ".".repeat(r.length)))}>
                Clear
              </Button>
            </div>

            <div
              role="grid"
              aria-label="Pixel grid"
              className="grid w-full max-w-md touch-none select-none gap-px rounded-md border border-border bg-border p-px"
              style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
              onPointerUp={() => setPaint(null)}
              onPointerLeave={() => setPaint(null)}
            >
              {rows.flatMap((row, y) =>
                [...row].map((cell, x) => (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    aria-label={`Pixel ${x + 1}, ${y + 1}: ${cell === "#" ? "on" : "off"}`}
                    className={`aspect-square ${cell === "#" ? "bg-foreground" : "bg-card hover:bg-muted"}`}
                    onPointerDown={(e) => {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      const v = cell === "#" ? "." : "#";
                      setPaint(v);
                      setCell(x, y, v);
                    }}
                    onPointerEnter={() => paint && setCell(x, y, paint)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setCell(x, y, cell === "#" ? "." : "#");
                      }
                    }}
                  />
                )),
              )}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-bold">Colours</legend>
              <p className="text-xs text-muted-foreground">They step diagonally, from the top left to the bottom right.</p>
              <div className="flex flex-wrap items-center gap-2">
                {colors.map((c, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-lg border border-border p-1">
                    <input
                      type="color"
                      aria-label={`Colour ${i + 1}`}
                      value={c}
                      onChange={(e) => setColors(colors.map((x, j) => (j === i ? e.target.value : x)))}
                      className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                    />
                    <button
                      type="button"
                      aria-label={`Remove colour ${i + 1}`}
                      disabled={colors.length === 1}
                      onClick={() => setColors(colors.filter((_, j) => j !== i))}
                      className="px-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {colors.length < 12 && (
                  <Button type="button" variant="neutral" size="sm" onClick={() => setColors([...colors, colors.at(-1) ?? "#000000"])}>
                    + Add colour
                  </Button>
                )}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold">Preview</span>
            <div className="flex items-center justify-center rounded-lg border border-border p-6" style={{ background: previewBackgrounds.light }}>
              {hasPixels ? <PixelLogo {...logo} className="size-28" /> : <Empty />}
            </div>
            {previewBackgrounds.dark && (
              <div className="dark flex items-center justify-center rounded-lg border border-border p-6" style={{ background: previewBackgrounds.dark }}>
                {hasPixels ? <PixelLogo {...logo} className="size-28" /> : <Empty />}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              {hasPixels && <PixelLogo {...logo} className="size-8" />}
              <span className="text-xs text-muted-foreground">Header size</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button
          type="button"
          disabled={pending || (enabled && !hasPixels)}
          onClick={() => run(() => saveSettings("logoPixel", enabled ? logo : null), "Saved. The site and its icons show it now.")}
        >
          {pending ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <Button
            type="button"
            variant="neutral"
            disabled={pending}
            onClick={() => {
              if (!confirm("Remove the saved logo and use the one in site.config.ts?")) return;
              run(() => resetSettings("logoPixel"), "Reset to site.config.ts.");
            }}
          >
            Reset to site.config.ts
          </Button>
        )}
        {enabled && !hasPixels && <p className="text-sm text-muted-foreground">Fill at least one pixel.</p>}
        {message && (
          <p role="status" className={`text-sm font-bold ${message.ok ? "text-foreground" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}

function Empty() {
  return <span className="text-xs text-muted-foreground">Empty</span>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex w-20 flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value) || min)} />
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

// Rows of equal width, with anything that is not "#" as empty.
function normalise(rows: string[]) {
  const width = Math.max(1, ...rows.map((r) => r.length));
  return rows.map((r) => r.replace(/[^#]/g, ".").padEnd(width, "."));
}
