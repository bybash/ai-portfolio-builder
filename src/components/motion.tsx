"use client";

import { animate, createDrawable, splitText, stagger, utils } from "animejs";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Page motion with Anime.js, driven by data attributes in the markup:
//   data-motion="hero-title"      headline: words rise out of a clipped line
//   data-motion="hero-highlight"  the highlighted words: a colour sweep behind them
//   data-motion="hero-item"       hero copy and buttons: fade up after the headline
//   data-motion="photo"           hero photo: wipes in from below
//   data-motion="label"           section label: "thinks" with its data-verb, then streams in
//   data-motion="rule"            the line after a section label: draws left to right
//   data-motion="draw"            an SVG icon: its strokes draw in
//   data-reveal                   fades up when scrolled into view
//   data-reveal-group             its children fade up one after another
//
// The inline script in layout.tsx adds `motion` to <html> before the first paint
// (unless the visitor prefers reduced motion), and globals.css hides the targets
// only while that class is there. Without JavaScript, or with reduced motion,
// everything shows at once.

const EASE = "out(4)";

function revealGroup(el: Element) {
  // The group itself stays hidden too, so a bordered box never shows empty.
  (el as HTMLElement).style.opacity = "1";
  const children = Array.from(el.children);
  animate(children, {
    opacity: [0, 1],
    y: [28, 0],
    duration: 800,
    delay: stagger(90),
    ease: EASE,
  });
  el.querySelectorAll("[data-motion='draw']").forEach((icon, i) => drawIcon(icon, 250 + i * 90));
}

function drawIcon(icon: Element, delay = 0) {
  const shapes = icon.querySelectorAll("path, circle, line, rect, polyline, polygon, ellipse");
  if (!shapes.length) return;
  animate(createDrawable(shapes), {
    draw: ["0 0", "0 1"],
    duration: 1100,
    delay: stagger(70, { start: delay }),
    ease: "inOut(3)",
  });
}

// Section labels answer like an AI agent: a spinning spark and a shimmering
// "Pondering…" status, then the heading streams in behind a caret. Screen
// readers get the real heading throughout through aria-label.
const THINK_MS = 1100;
const CHAR_MS = 32;
const CARET_MS = 700;
const timers = new Set<ReturnType<typeof setTimeout>>();

function later(fn: () => void, ms: number) {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
  return t;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function streamLabel(el: HTMLElement) {
  if (el.dataset.state) return;
  const text = el.dataset.text ?? el.textContent ?? "";
  el.dataset.text = text;
  el.setAttribute("aria-label", text);
  const verb = escapeHtml(el.dataset.verb || "Thinking");

  el.dataset.state = "thinking";
  el.innerHTML = `<span aria-hidden="true" class="label-spark">✻</span><span aria-hidden="true" class="label-shimmer">${verb}…</span>`;

  later(() => {
    el.dataset.state = "streaming";
    // The content comes in as the heading starts typing, not after it.
    releaseWaiting(el);
    let i = 0;
    const step = () => {
      i += 1;
      el.innerHTML = `<span aria-hidden="true">${escapeHtml(text.slice(0, i))}</span><span aria-hidden="true" class="label-caret"></span>`;
      if (i < text.length) later(step, CHAR_MS);
      else later(() => finishLabel(el), CARET_MS);
    };
    step();
  }, THINK_MS);
}

function finishLabel(el: HTMLElement) {
  if (el.dataset.text !== undefined) el.textContent = el.dataset.text;
  el.removeAttribute("aria-label");
  el.dataset.state = "done";
  releaseWaiting(el);
}

// The section's content waits for its heading to start, like a reply after its title.
function releaseWaiting(el: HTMLElement) {
  el.dataset.typed = "";
  const waiting = waitingOnLabel.get(el) ?? [];
  waitingOnLabel.delete(el);
  waiting.forEach((target, i) => later(() => revealContent(target), i * 120));
}

// Content scrolled into view before its section's label has finished streaming.
const waitingOnLabel = new Map<HTMLElement, Element[]>();

function resetLabels() {
  waitingOnLabel.clear();
  timers.forEach(clearTimeout);
  timers.clear();
  document.querySelectorAll<HTMLElement>("[data-motion='label'][data-state]").forEach(finishLabel);
}

function revealOne(el: Element) {
  const motion = el.getAttribute("data-motion");
  if (motion === "label") {
    streamLabel(el as HTMLElement);
    return;
  }
  if (motion === "rule") {
    animate(el, { scaleX: [0, 1], duration: 1200, ease: "inOut(3)" });
    return;
  }
  const label = el.closest("section")?.querySelector<HTMLElement>("[data-motion='label']");
  if (label && label.dataset.typed === undefined) {
    waitingOnLabel.set(label, [...(waitingOnLabel.get(label) ?? []), el]);
    // If the page opened below the label, it never scrolls into view: play it now.
    streamLabel(label);
    return;
  }
  revealContent(el);
}

function revealContent(el: Element) {
  if (el.hasAttribute("data-reveal-group")) {
    revealGroup(el);
    return;
  }
  animate(el, { opacity: [0, 1], y: [28, 0], duration: 800, ease: EASE });
}

// The hero answers like an AI chat: a "Thinking…" status, then the headline
// and the intro stream in word by word behind a caret, then the buttons. The
// photo prints alongside, top to bottom, as the text grows (on phones it
// "generates" instead: noisy and blurred, sharpening step by step).
const HERO_THINK_VERBS = ["Thinking", "Pondering", "Composing"];
const HERO_THINK_MS = 1300;
const TITLE_WORD_MS = 90;
const BODY_WORD_MS = 55;
const PHOTO_MS = 2800;

function makeCaret() {
  const caret = document.createElement("span");
  caret.className = "stream-caret";
  caret.setAttribute("aria-hidden", "true");
  return caret;
}

// Reveals `words` one after another, with the caret riding after the newest one.
// `onReveal` hears about each word as it appears.
function streamWords(
  words: HTMLElement[],
  wordMs: number,
  caret: HTMLElement,
  onReveal: (el: HTMLElement) => void,
  done: () => void,
) {
  let i = 0;
  const step = () => {
    const word = words[i];
    // Unrevealed words are invisible but keep their place, so nothing on the
    // page moves as they arrive (no layout shift).
    word.style.visibility = "";
    animate(word, { opacity: [0, 1], duration: 220, ease: "out(2)" });
    word.after(caret);
    onReveal(word);
    i += 1;
    if (i < words.length) later(step, wordMs);
    else later(done, wordMs);
  };
  if (words.length) step();
  else done();
}

function playThinking(el: HTMLElement | null) {
  if (!el) return { stop: () => {}, fade: () => {} };
  const start = performance.now();
  let v = 0;
  const render = () => {
    el.innerHTML = `<span class="label-spark">✻</span><span class="stream-shimmer">${HERO_THINK_VERBS[v % HERO_THINK_VERBS.length]}…</span>`;
  };
  el.style.display = "flex";
  render();
  let cycleTimer: ReturnType<typeof setTimeout>;
  const cycle = () => {
    v += 1;
    render();
    cycleTimer = later(cycle, HERO_THINK_MS / HERO_THINK_VERBS.length);
  };
  cycleTimer = later(cycle, HERO_THINK_MS / HERO_THINK_VERBS.length);
  return {
    // Ends the verb cycle and leaves "Thought for 2s" before fading out.
    stop: () => {
      clearTimeout(cycleTimer);
      timers.delete(cycleTimer);
      const secs = Math.max(1, Math.round((performance.now() - start) / 1000));
      el.innerHTML = `<span class="label-spark is-done">✻</span><span>Thought for ${secs}s</span>`;
    },
    fade: () => animate(el, { opacity: [1, 0], duration: 600, delay: 900, ease: "out(2)" }),
  };
}

// On wide screens the photo prints like a printer: the image sits at its final
// size from the start, pinned to the top, and the box grows downward level
// with the newest line of hero text, uncovering it row by row. It sharpens in steps as it goes, like
// an AI image generating, while a print head (a glowing, grainy band) rides
// the bottom edge and the chip counts how much has printed. `finalHeight`
// is the box's height once the hero is complete. Returns `follow`, called with
// each newly revealed element, and `release`, which hands the size back to CSS:
// smoothly, or at once with `now` (when the page is torn down).
type PhotoRun = { follow: (el: HTMLElement) => void; release: (now?: boolean) => void };

function printPhoto(photo: HTMLElement, finalHeight: number): PhotoRun {
  const START = 52;
  const layers = Array.from(photo.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.dataset.motion !== "photo-gen",
  );
  const gen = photo.querySelector<HTMLElement>("[data-motion='photo-gen']");
  const label = gen?.querySelector<HTMLElement>("[data-photo-gen-label]");
  const noise = gen?.querySelector<HTMLElement>(".photo-gen-noise");
  const scan = gen?.querySelector<HTMLElement>(".photo-gen-scan");
  const img = photo.querySelector("img");

  // The image and its colour wash keep the final height, so nothing rescales.
  // Their own inline styles (next/image sets some) are restored afterwards.
  const saved = layers.map((el) => el.style.cssText);
  // Fully blurred before it shows, so the first frame is never sharp (set after
  // saving the styles above, so they restore clean). The transition comes after,
  // for the steps while it prints.
  if (img) {
    img.style.filter = "blur(18px) saturate(0.4)";
    void img.offsetHeight;
    img.style.transition = "filter 0.3s";
  }
  layers.forEach((el) => {
    el.style.height = `${finalHeight}px`;
    el.style.bottom = "auto";
  });
  gen?.classList.add("is-printing");
  photo.style.opacity = "1";
  if (gen) gen.style.display = "block";
  photo.style.minHeight = "0";
  photo.style.height = `${START}px`;
  void photo.offsetHeight;
  photo.style.transition = "height 0.45s cubic-bezier(0.3, 0.7, 0.3, 1)";

  let released = false;
  const follow = (el: HTMLElement) => {
    if (released) return;
    const reached = el.getBoundingClientRect().bottom - photo.getBoundingClientRect().top;
    const h = Math.min(finalHeight, Math.max(START, Math.round(reached)));
    photo.style.height = `${h}px`;
    const pct = Math.round(((h - START) / Math.max(finalHeight - START, 1)) * 100);
    if (label) label.textContent = `Generating image… ${pct}%`;
    // Sharpens in steps as it prints, like a diffusion model's passes.
    const left = 1 - Math.floor(pct / 12.5) / 8;
    if (img) img.style.filter = left > 0 ? `blur(${(left * 18).toFixed(1)}px) saturate(${0.4 + 0.6 * (1 - left)})` : "";
  };

  const clear = () => {
    photo.style.transition = "";
    photo.style.height = "";
    photo.style.minHeight = "";
    if (img) img.style.filter = "";
    layers.forEach((el, i) => (el.style.cssText = saved[i]));
    gen?.classList.remove("is-printing");
  };
  const finish = () => {
    if (img) img.style.filter = "";
    if (label) label.textContent = "Image ready";
    if (noise) noise.style.opacity = "0";
    if (scan) scan.style.opacity = "0";
    if (gen) animate(gen, { opacity: [1, 0], duration: 500, delay: 700, ease: "out(2)" });
  };
  const release = (now?: boolean) => {
    released = true;
    if (now) return clear();
    photo.style.height = `${finalHeight}px`;
    finish();
    later(clear, 600);
  };
  return { follow, release };
}

// On phones the photo sits above the text at a fixed size, so it "generates"
// instead: noisy and blurred, sharpening in steps like a diffusion model.
function generatePhoto(finalHeight: number): PhotoRun {
  const idle: PhotoRun = { follow: () => {}, release: () => {} };
  const photo = document.querySelector<HTMLElement>("[data-motion='photo']");
  if (!photo) return idle;
  if (photo.parentElement && matchMedia("(min-width: 768px)").matches && finalHeight > 0) {
    return printPhoto(photo, finalHeight);
  }
  const img = photo.querySelector("img");
  const gen = photo.querySelector<HTMLElement>("[data-motion='photo-gen']");
  const label = gen?.querySelector<HTMLElement>("[data-photo-gen-label]");
  const noise = gen?.querySelector<HTMLElement>(".photo-gen-noise");
  const scan = gen?.querySelector<HTMLElement>(".photo-gen-scan");

  if (img) img.style.filter = "blur(26px) saturate(0.4)";
  photo.style.opacity = "1";
  if (gen) gen.style.display = "block";
  const state = { p: 0 };
  animate(state, {
    p: 100,
    duration: PHOTO_MS,
    ease: "inOut(2)",
    onUpdate: () => {
      const pass = Math.floor(state.p / 12.5);
      const left = 1 - pass / 8;
      if (img) img.style.filter = `blur(${(left * 26).toFixed(1)}px) saturate(${0.4 + 0.6 * (1 - left)})`;
      if (noise) noise.style.opacity = String(0.55 * left);
      if (scan) scan.style.top = `${state.p}%`;
      if (label) label.textContent = `Generating image… ${Math.round(state.p)}%`;
    },
    onComplete: () => {
      if (img) img.style.filter = "";
      if (label) label.textContent = "Image ready";
      if (gen) animate(gen, { opacity: [1, 0], duration: 500, delay: 500, ease: "out(2)" });
    },
  });
  if (img) animate(img, { scale: [1.08, 1], duration: PHOTO_MS + 400, ease: EASE });
  return idle;
}

// The headline uses balanced wrapping, which would re-balance its lines after
// every new word. Lock the final line breaks first, so words stream into the
// lines they will end up on. Returns a function that removes the locks.
function lockLines(container: HTMLElement, words: HTMLElement[]) {
  const breaks: HTMLElement[] = [];
  let lastTop: number | null = null;
  let prev: HTMLElement | null = null;
  for (const word of words) {
    const top = word.getBoundingClientRect().top;
    if (prev && lastTop !== null && top - lastTop > 4) {
      let anchor: HTMLElement = prev;
      while (anchor.parentElement && anchor.parentElement !== container) anchor = anchor.parentElement;
      const br = document.createElement("br");
      anchor.after(br);
      breaks.push(br);
    }
    lastTop = top;
    prev = word;
  }
  container.style.textWrap = "wrap";
  return () => {
    breaks.forEach((br) => br.remove());
    container.style.textWrap = "";
  };
}

// The activity log under the intro: its lines fade in together, and their
// numbers count up.
function showLog(lines: HTMLElement[]) {
  if (!lines.length) return;
  lines.forEach((line) => (line.style.visibility = ""));
  animate(lines, { opacity: [0, 1], y: [8, 0], duration: 600, ease: EASE });
  lines.forEach((line) =>
    line.querySelectorAll<HTMLElement>("[data-count]").forEach((num) => {
      const target = Number(num.dataset.count);
      const counter = { n: 0 };
      num.textContent = "0";
      animate(counter, {
        n: target,
        duration: 900,
        ease: "out(3)",
        onUpdate: () => {
          num.textContent = Math.round(counter.n).toLocaleString("en-GB");
        },
      });
    }),
  );
}

// While the hero plays on a fresh load of the home page, the header shows only
// the logo (layout.tsx adds .hero-playing before the first paint; CSS hides
// [data-header-extra]). Its links come back when the hero finishes, or at once
// when the visitor scrolls, presses a key, touches the screen or points at
// the header.
function showHeader() {
  document.documentElement.classList.remove("hero-playing");
}

function quietHeader() {
  const header = document.querySelector("header");
  const onScroll = () => {
    if (window.scrollY > 10) show();
  };
  const show = () => {
    showHeader();
    stop();
  };
  const stop = () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("keydown", show);
    window.removeEventListener("touchstart", show);
    header?.removeEventListener("pointerenter", show);
    header?.removeEventListener("focusin", show);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", show);
  window.addEventListener("touchstart", show, { passive: true });
  header?.addEventListener("pointerenter", show);
  header?.addEventListener("focusin", show);
  return stop;
}

// `onDone` runs once the hero has finished, so the sections below wait their turn.
function playHero(onDone: () => void) {
  const title = document.querySelector<HTMLElement>("[data-motion='hero-title']");
  if (!title) {
    onDone();
    return () => {};
  }
  const body = document.querySelector<HTMLElement>("[data-motion='hero-stream']");

  // splitText keeps a hidden copy for screen readers, so the visible words are
  // the ones it returns.
  // The photo's size once everything has streamed in, measured while the
  // finished layout is still there (the text is invisible but takes space).
  const finalPhotoHeight =
    document.querySelector<HTMLElement>("[data-motion='photo']")?.getBoundingClientRect().height ?? 0;
  const titleSplit = splitText(title, { words: true });
  const bodySplits = body ? Array.from(body.querySelectorAll("p")).map((p) => splitText(p, { words: true })) : [];
  const titleWords = titleSplit.words as HTMLElement[];
  const bodyWords = bodySplits.flatMap((s) => s.words as HTMLElement[]);
  const unlockLines = lockLines(title, titleWords);
  // Everything still to come is invisible but keeps its place, so the hero has
  // its final size from the start and nothing below it moves.
  utils.set([...titleWords, ...bodyWords], { opacity: 0, visibility: "hidden" });
  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-motion='hero-item']"));
  items.forEach((el) => (el.style.visibility = "hidden"));
  const logLines = Array.from(document.querySelectorAll<HTMLElement>("[data-motion='hero-log'] > li"));
  logLines.forEach((el) => (el.style.visibility = "hidden"));
  title.style.opacity = "1";
  if (body) body.style.opacity = "1";

  const stopQuietHeader = quietHeader();
  const caret = makeCaret();
  const thinking = playThinking(document.querySelector<HTMLElement>("[data-motion='hero-thinking']"));
  const photo = generatePhoto(finalPhotoHeight);

  later(() => {
    thinking.stop();
    streamWords(titleWords, TITLE_WORD_MS, caret, photo.follow, () => {
      unlockLines();
      animate(title.querySelectorAll("[data-motion='hero-highlight']"), {
        backgroundSize: ["0% 100%", "100% 100%"],
        duration: 700,
        ease: "inOut(3)",
      });
      streamWords(bodyWords, BODY_WORD_MS, caret, photo.follow, () => {
        caret.remove();
        // The activity log, the chips and the header's links fade in together
        // once the text is in.
        showLog(logLines);
        showHeader();
        items.forEach((el) => (el.style.visibility = ""));
        animate(items, { opacity: [0, 1], y: [8, 0], duration: 600, ease: EASE });
        photo.release();
        later(onDone, 300);
        // The "scroll" hint under the hero (scroll-cue.tsx) waits for this.
        later(() => document.documentElement.classList.add("hero-done"), 900);
        thinking.fade();
      });
    });
  }, HERO_THINK_MS);

  return () => {
    stopQuietHeader();
    showHeader();
    photo.release(true);
    unlockLines();
    caret.remove();
    items.forEach((el) => (el.style.visibility = ""));
    logLines.forEach((el) => (el.style.visibility = ""));
    titleSplit.revert();
    bodySplits.forEach((s) => s.revert());
  };
}

// Back and forward navigation restores the old scroll position, so playing the
// page from the top would leave the visitor looking at hidden sections. Those
// visits (and any page that opens already scrolled down) skip the motion.
let cameBack = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    cameBack = true;
  });
}

function openedMidPage() {
  if (cameBack) return true;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type === "back_forward" && performance.now() < 5000) return true;
  return window.scrollY > 200;
}

// The home page animates only when it is the page the browser loaded (a
// first visit or a refresh). Arriving at it from another page of the site, by
// a link or the back button, shows it straight away. Set inside the frame
// callback, not the effect, so React's dev double-run cannot use it up.
let documentLoad = true;

export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("motion")) return;

    let cleanup = () => {};
    // One frame later, so the restored scroll position is in place.
    const frame = requestAnimationFrame(() => {
      const landed = documentLoad;
      documentLoad = false;
      if (openedMidPage() || (pathname === "/" && !landed)) {
        cameBack = false;
        root.classList.add("motion-skip");
        showHeader();
        return;
      }
      root.classList.remove("motion-skip");
      root.classList.add("motion-ready");
      cleanup = playPage();
    });

    return () => {
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [pathname]);

  return null;
}

function playPage() {
  const targets = document.querySelectorAll(
    "[data-reveal], [data-reveal-group], [data-motion='label'], [data-motion='rule']",
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        revealOne(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );

  // Sections start after the hero, so one "reply" streams at a time, unless
  // the visitor scrolls down first: then they start straight away.
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    window.removeEventListener("scroll", onScroll);
    targets.forEach((t) => observer.observe(t));
  };
  const onScroll = () => {
    if (window.scrollY > window.innerHeight * 0.35) start();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  // Timers from `later` are cleared on cleanup, so this never fires late.
  const revertHero = playHero(start);

  return () => {
    window.removeEventListener("scroll", onScroll);
    observer.disconnect();
    resetLabels();
    revertHero();
  };
}
