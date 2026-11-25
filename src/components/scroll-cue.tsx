"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

// A small "scroll" hint at the bottom of the hero, on screens where the hero
// fills the window. It fades in once the hero has played (CSS, .scroll-cue in
// globals.css), hides as soon as the visitor scrolls, and a click scrolls to
// the section after the hero.
export function ScrollCue() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.toggleAttribute("data-hidden", window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function scrollOn() {
    const next = ref.current?.closest("section")?.nextElementSibling;
    if (!next) return;
    window.scrollTo({
      // Leave a little space above the section's label.
      top: next.getBoundingClientRect().top + window.scrollY - 32,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={scrollOn}
      aria-label="Scroll to the next section"
      className="scroll-cue absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-0.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground md:flex"
    >
      scroll
      <ChevronDown aria-hidden className="scroll-cue-arrow size-4" />
    </button>
  );
}
