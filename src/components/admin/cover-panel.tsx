"use client";

import { ImagePlus } from "lucide-react";

import { panelTextarea, SidePanel } from "@/components/admin/side-panel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CoverPanel({
  idea,
  disabled,
  drawing,
  onIdea,
  onDraw,
}: {
  idea: string;
  disabled: boolean;
  drawing: boolean;
  onIdea: (idea: string) => void;
  /** Draws this scene, or one the AI suggests when it is empty. */
  onDraw: (idea: string) => void;
}) {
  return (
    <SidePanel title="Cover with AI" icon={<ImagePlus aria-hidden className="size-4 text-link" />}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cover-idea">Scene</Label>
        <textarea
          id="cover-idea"
          value={idea}
          maxLength={1000}
          onChange={(e) => onIdea(e.target.value)}
          placeholder="Describe the picture, or leave empty for a suggestion"
          className={panelTextarea}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={disabled} onClick={() => onDraw(idea)}>
          {drawing ? "Drawing…" : "Draw this"}
        </Button>
        <Button type="button" size="sm" variant="neutral" disabled={disabled} onClick={() => onDraw("")}>
          New scene
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Paid, usually a few cents each time.</p>
    </SidePanel>
  );
}
