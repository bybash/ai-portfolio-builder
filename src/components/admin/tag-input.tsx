"use client";

import { X } from "lucide-react";
import { useState } from "react";

// Tags as chips: Enter or a comma adds one, Backspace on an empty field removes the last.
export function TagInput({ id, value, onChange }: { id: string; value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState("");

  function add(raw: string) {
    const added = raw.split(",").map((t) => t.trim()).filter((t) => t && !value.includes(t));
    if (added.length) onChange([...value, ...new Set(added)]);
    setText("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-2 focus-within:ring-2 focus-within:ring-ring/40">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
          {tag}
          <button type="button" aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))} className="text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={text}
        placeholder={value.length ? "" : "Add a tag"}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setText(e.target.value))}
        onBlur={() => add(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        className="min-w-20 flex-1 bg-transparent px-1 text-sm outline-none"
      />
    </div>
  );
}
