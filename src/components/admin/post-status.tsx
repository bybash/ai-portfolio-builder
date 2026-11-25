import type { PostStatus } from "@/lib/post-schema";

export function PostStatusPill({ status }: { status: PostStatus }) {
  const live = status === "published";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${live ? "bg-link" : "bg-muted-foreground"}`} />
      {live ? "Live" : "Draft"}
    </span>
  );
}
