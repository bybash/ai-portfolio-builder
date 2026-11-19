"use client";

import { Play, Square } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type Faq = { id: string; question: string; answer: string };

// The FAQ as a chat: each question has a play button. Pressing it shows a short
// "Accordioning…" status, then streams the answer word by word behind a caret, and
// the button turns into a stop button. Stop cuts the stream, folds the answer
// away and brings the play button back.
export function FaqChat({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <ul data-reveal-group className={`flex flex-col gap-4 ${className ?? ""}`}>
      {faqs.map((faq) => (
        <FaqItem key={faq.id} faq={faq} />
      ))}
    </ul>
  );
}

const THINK_MS = 650;
const WORD_MS = 28;

type Phase = "idle" | "thinking" | "streaming" | "done";

function FaqItem({ faq }: { faq: Faq }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [shown, setShown] = useState(0);
  const words = useMemo(() => faq.answer.split(/\s+/), [faq.answer]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const play = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(words.length);
      setPhase("done");
      return;
    }
    setShown(0);
    setPhase("thinking");
    timer.current = setTimeout(() => {
      setPhase("streaming");
      let n = 0;
      const step = () => {
        n += 1;
        setShown(n);
        if (n < words.length) timer.current = setTimeout(step, WORD_MS);
        else setPhase("done");
      };
      step();
    }, THINK_MS);
  };

  const stop = () => {
    clear();
    const el = panel.current;
    const reset = () => {
      setPhase("idle");
      setShown(0);
    };
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return reset();
    // Fold the answer away, then return to the play state.
    const fold = el.animate(
      [
        { height: `${el.offsetHeight}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: 260, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
    );
    // Hide the panel before letting go of the animation, so it never flashes
    // back to full height for a frame.
    fold.onfinish = () => {
      el.hidden = true;
      fold.cancel();
      reset();
    };
  };

  const open = phase !== "idle";
  return (
    <li className="rounded-lg border border-border bg-card shadow-brutal-sm">
      <button
        type="button"
        onClick={open ? stop : play}
        aria-expanded={open}
        aria-controls={panelId}
        className="group flex w-full items-center justify-between gap-4 rounded-lg px-5 py-4 text-left text-base font-bold outline-none transition-colors hover:bg-secondary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>{faq.question}</span>
        <span
          aria-hidden
          className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${
            open ? "bg-foreground text-background" : "bg-primary text-primary-foreground group-hover:brightness-110"
          }`}
        >
          {open ? <Square className="size-3 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 size-3.5 fill-current" strokeWidth={0} />}
        </span>
        <span className="sr-only">{open ? "Hide answer" : "Show answer"}</span>
      </button>
      <div ref={panel} id={panelId} hidden={!open} className="overflow-hidden">
        <div className="px-5 pt-1 pb-4 text-sm text-muted-foreground">
          {phase === "thinking" && (
            <p aria-hidden className="flex items-center gap-2 text-xs">
              <span className="label-spark">✻</span>
              <span className="stream-shimmer">Accordioning…</span>
            </p>
          )}
          {phase !== "thinking" && open && (
            <>
              <p aria-hidden>
                {words.slice(0, shown).join(" ")}
                {phase === "streaming" && <span className="stream-caret" />}
              </p>
              <p className="sr-only">{faq.answer}</p>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
