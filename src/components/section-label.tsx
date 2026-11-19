// The label that opens each home page section, with a rule running to the
// right edge. It is the section's h2. When it scrolls into view, the motion
// component plays it like an AI agent answering: a "thinking" status with
// `verb` (for example "Pondering…"), then the heading streams in.
export function SectionLabel({
  children,
  verb = "Thinking",
  className = "mb-6",
}: {
  children: React.ReactNode;
  verb?: string;
  className?: string;
}) {
  return (
    <div className={`${className} flex items-center gap-3`}>
      <h2
        data-motion="label"
        data-verb={verb}
        className="rounded-lg border border-border bg-foreground px-3 py-1 font-sans text-xs font-semibold tracking-wide text-background uppercase"
      >
        {children}
      </h2>
      <span data-motion="rule" aria-hidden className="h-0.5 flex-1 bg-border" />
    </div>
  );
}
