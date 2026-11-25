"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { panelTextarea, SidePanel } from "@/components/admin/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DraftRequest = { topic: string; notes: string; withCover: boolean };

export function DraftPanel({
  open,
  aiReady,
  coversReady,
  busy,
  drafting,
  onDraft,
}: {
  open: boolean;
  aiReady: boolean;
  coversReady: boolean;
  busy: boolean;
  drafting: boolean;
  onDraft: (request: DraftRequest) => void;
}) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [withCover, setWithCover] = useState(false);

  return (
    <SidePanel title="Draft with AI" icon={<Sparkles aria-hidden className="size-4 text-link" />} open={open}>
      {aiReady ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Your points and facts</Label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={panelTextarea} />
          </div>
          {coversReady && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={withCover} onChange={(e) => setWithCover(e.target.checked)} className="size-4 accent-primary" />
              Also make a cover <span className="text-muted-foreground">(paid, a few cents)</span>
            </label>
          )}
          <Button type="button" size="sm" onClick={() => onDraft({ topic, notes, withCover: withCover && coversReady })} disabled={busy || topic.trim().length < 3}>
            {drafting ? "Drafting…" : "Write a draft"}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Set AI_API_KEY to turn this on. Writing by hand works without it.</p>
      )}
    </SidePanel>
  );
}
