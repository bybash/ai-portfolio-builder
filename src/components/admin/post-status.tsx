export function PostStatusPill({ status }: { status: "draft" | "published" }) {
  const live = status === "published";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${live ? "bg-emerald-500" : "bg-amber-500"}`} />
      {live ? "Live" : "Draft"}
    </span>
  );
}
