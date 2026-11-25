"use client";

import { useEffect, useRef, useState } from "react";

// Email links do nothing when the browser has no mail app or webmail set up
// to handle them. After a click on any mailto: link, this waits a moment: if
// the page lost focus, a mail app or tab opened and nothing more happens.
// Otherwise it copies the address and says so, or shows it with a Copy button
// when the browser won't allow copying.
export function MailtoFallback() {
  const [notice, setNotice] = useState<{ email: string; copied: boolean } | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function show(email: string, copied: boolean) {
      setNotice({ email, copied });
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setNotice(null), copied ? 4000 : 10000);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="mailto:"]');
      if (!link) return;
      const email = decodeURIComponent(link.getAttribute("href")!.slice(7).split("?")[0]);
      if (!email) return;

      let left = false;
      const onLeave = () => {
        left = true;
      };
      window.addEventListener("blur", onLeave, { once: true });
      document.addEventListener("visibilitychange", onLeave, { once: true });

      window.setTimeout(async () => {
        window.removeEventListener("blur", onLeave);
        document.removeEventListener("visibilitychange", onLeave);
        if (left || document.hidden || !document.hasFocus()) return;
        try {
          await navigator.clipboard.writeText(email);
          show(email, true);
        } catch {
          show(email, false);
        }
      }, 900);
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  async function copy() {
    if (!notice) return;
    try {
      await navigator.clipboard.writeText(notice.email);
      setNotice({ ...notice, copied: true });
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setNotice(null), 3000);
    } catch {
      // Leave the address on screen to copy by hand.
    }
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {notice && (
        <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-lg">
          <span className="truncate">
            {notice.copied ? "No mail app opened, so the address is copied: " : "No mail app opened. Email: "}
            <span className="font-semibold select-all">{notice.email}</span>
          </span>
          {notice.copied ? (
            <button type="button" onClick={() => setNotice(null)} className="rounded-full px-2 py-1 text-background/70 hover:text-background" aria-label="Dismiss">
              ✕
            </button>
          ) : (
            <button type="button" onClick={copy} className="rounded-full bg-background px-3 py-1 font-medium text-foreground">
              Copy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
