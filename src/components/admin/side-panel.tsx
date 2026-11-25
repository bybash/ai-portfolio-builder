import { ChevronDown } from "lucide-react";

export const panelTextarea = "min-h-28 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm";

export function SidePanel({ title, icon, open, children }: { title: string; icon?: React.ReactNode; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {icon}
        {title}
        <ChevronDown aria-hidden className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-4">{children}</div>
    </details>
  );
}
