"use client";

import { Moon, Sun } from "lucide-react";

// Light / dark switch. The "dark" class on <html> is set before paint by the
// script in src/app/layout.tsx; this flips it and remembers the choice.
export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage blocked: the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      aria-label="Switch between light and dark mode"
      onClick={toggle}
      className={className}
    >
      <Moon className="size-[18px] dark:hidden" />
      <Sun className="hidden size-[18px] dark:block" />
    </button>
  );
}
