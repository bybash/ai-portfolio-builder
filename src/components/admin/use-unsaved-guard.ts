import { useEffect } from "react";

const QUESTION = "You have unsaved changes. Leave without saving?";

/** Asks before unsaved writing is lost: closing the tab, following a link, going back, or logging out. */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;

    const onUnload = (e: BeforeUnloadEvent) => e.preventDefault();

    function stopUnlessSure(e: Event) {
      if (confirm(QUESTION)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      // Links in the text being edited are not followed.
      if (link.isContentEditable || link.origin !== location.origin) return;
      if (link.pathname === location.pathname && link.hash) return;
      stopUnlessSure(e);
    }

    function onSubmit(e: SubmitEvent) {
      // The editor's own dialogs handle their forms without leaving the page.
      if ((e.target as Element).closest("dialog")) return;
      stopUnlessSure(e);
    }

    // Back and forward. Browsers without the Navigation API don't ask.
    function onNavigate(e: Event) {
      if ((e as Event & { navigationType?: string }).navigationType !== "traverse" || !e.cancelable) return;
      if (!confirm(QUESTION)) e.preventDefault();
    }
    const navigation = (window as Window & { navigation?: EventTarget }).navigation;

    navigation?.addEventListener("navigate", onNavigate);
    window.addEventListener("beforeunload", onUnload);
    // On window, in the capture phase: before the router sees the event.
    window.addEventListener("click", onClick, true);
    window.addEventListener("submit", onSubmit, true);
    return () => {
      navigation?.removeEventListener("navigate", onNavigate);
      window.removeEventListener("beforeunload", onUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("submit", onSubmit, true);
    };
  }, [dirty]);
}
