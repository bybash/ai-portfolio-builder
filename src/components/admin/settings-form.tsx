"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveSettings, resetSettings } from "@/app/admin/(protected)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsSection } from "@/lib/site-settings-schema";

// A form described by data, for the settings pages: plain text, lists of text,
// lists of rows (each row a few fields), groups that can be switched off, and
// on/off switches. The value is kept as JSON and validated on the server.
export type FieldSpec =
  | { kind: "text"; key: string; label: string; help?: string; multiline?: boolean; placeholder?: string }
  | { kind: "select"; key: string; label: string; help?: string; options: string[] }
  | { kind: "boolean"; key: string; label: string; help?: string; note?: string }
  | { kind: "strings"; key: string; label: string; help?: string; multiline?: boolean; addLabel?: string }
  | { kind: "list"; key: string; label: string; help?: string; fields: FieldSpec[]; addLabel?: string }
  | { kind: "group"; key: string; label: string; help?: string; fields: FieldSpec[]; nullable?: boolean };

type Value = Record<string, unknown>;

function emptyValue(field: FieldSpec): unknown {
  switch (field.kind) {
    case "text":
      return "";
    case "select":
      return field.options[0] ?? "";
    case "boolean":
      return false;
    case "strings":
    case "list":
      return [];
    case "group":
      return emptyObject(field.fields);
  }
}

function emptyObject(fields: FieldSpec[]): Value {
  return Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)]));
}

export function SettingsForm({
  section,
  title,
  description,
  fields,
  initial,
  saved,
  resetKeys,
}: {
  section: SettingsSection;
  title: string;
  description?: string;
  fields: FieldSpec[];
  initial: Value;
  // Whether this section has values saved in the admin (or only the file's).
  saved: boolean;
  // For `home`: the keys this form edits, so a reset leaves the others alone.
  resetKeys?: string[];
}) {
  const [value, setValue] = useState<Value>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

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

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-brutal-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
        </div>
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {saved ? "Saved in admin" : "From site.config.ts"}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {fields.map((field) => (
          <FieldEditor
            key={field.key}
            field={field}
            value={value[field.key]}
            onChange={(v) => setValue((prev) => ({ ...prev, [field.key]: v }))}
            id={`${section}-${field.key}`}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button type="button" disabled={pending} onClick={() => run(() => saveSettings(section, value), "Saved. The site shows it now.")}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {saved && (
          <Button
            type="button"
            variant="neutral"
            disabled={pending}
            onClick={() => {
              if (!confirm("Remove the saved values and use the ones in site.config.ts?")) return;
              run(() => resetSettings(section, resetKeys), "Reset to site.config.ts.");
            }}
          >
            Reset to site.config.ts
          </Button>
        )}
        {message && (
          <p role="status" className={`text-sm font-bold ${message.ok ? "text-foreground" : "text-destructive"}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}

function Help({ text }: { text?: string }) {
  return text ? <p className="text-xs text-muted-foreground">{text}</p> : null;
}

function FieldEditor({
  field,
  value,
  onChange,
  id,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  id: string;
}) {
  switch (field.kind) {
    case "text": {
      const Control = field.multiline ? Textarea : Input;
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Control
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            rows={field.multiline ? 3 : undefined}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
          />
          <Help text={field.help} />
        </div>
      );
    }
    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <select
            id={id}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
          >
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <Help text={field.help} />
        </div>
      );
    case "boolean":
      return (
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold">
            <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="size-4" />
            {field.label}
          </label>
          <Help text={field.help} />
          {field.note && <p className="text-xs font-bold text-muted-foreground">{field.note}</p>}
        </div>
      );
    case "strings": {
      const items = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-bold">{field.label}</legend>
          <Help text={field.help} />
          {items.map((item, i) => (
            <RowControls key={i} index={i} count={items.length} onMove={(to) => onChange(move(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))}>
              {field.multiline ? (
                <Textarea aria-label={`${field.label} ${i + 1}`} value={item} rows={2} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
              ) : (
                <Input aria-label={`${field.label} ${i + 1}`} value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
              )}
            </RowControls>
          ))}
          <Button type="button" variant="neutral" size="sm" className="w-fit" onClick={() => onChange([...items, ""])}>
            + {field.addLabel ?? "Add"}
          </Button>
        </fieldset>
      );
    }
    case "list": {
      const items = Array.isArray(value) ? (value as Value[]) : [];
      return (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-sm font-bold">{field.label}</legend>
          <Help text={field.help} />
          {items.map((item, i) => (
            <RowControls key={i} index={i} count={items.length} onMove={(to) => onChange(move(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))}>
              <div className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
                {field.fields.map((sub) => (
                  <div key={sub.key} className={sub.kind === "text" && sub.multiline ? "sm:col-span-2" : undefined}>
                    <FieldEditor
                      field={sub}
                      value={item[sub.key]}
                      onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [sub.key]: v } : x)))}
                      id={`${id}-${i}-${sub.key}`}
                    />
                  </div>
                ))}
              </div>
            </RowControls>
          ))}
          <Button type="button" variant="neutral" size="sm" className="w-fit" onClick={() => onChange([...items, emptyObject(field.fields)])}>
            + {field.addLabel ?? "Add"}
          </Button>
        </fieldset>
      );
    }
    case "group": {
      const on = value !== null && value !== undefined;
      const obj = (on ? value : {}) as Value;
      return (
        <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <legend className="px-1 text-sm font-bold">{field.label}</legend>
          <Help text={field.help} />
          {field.nullable && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked ? emptyObject(field.fields) : null)} className="size-4" />
              Show
            </label>
          )}
          {on &&
            field.fields.map((sub) => (
              <FieldEditor key={sub.key} field={sub} value={obj[sub.key]} onChange={(v) => onChange({ ...obj, [sub.key]: v })} id={`${id}-${sub.key}`} />
            ))}
        </fieldset>
      );
    }
  }
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowControls({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const button =
    "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-4";
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <div className="flex shrink-0 flex-col">
        <button type="button" className={button} aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
          <ArrowUp />
        </button>
        <button type="button" className={button} aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
          <ArrowDown />
        </button>
        <button type="button" className={button} aria-label="Remove" onClick={onRemove}>
          <Trash2 />
        </button>
      </div>
    </div>
  );
}
