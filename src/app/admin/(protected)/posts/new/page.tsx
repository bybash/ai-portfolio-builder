import { PostEditor } from "@/components/admin/post-editor";
import { aiConfigured } from "@/lib/ai-client";
import { imagesConfigured } from "@/lib/ai-env";
import { siteUrl } from "@/lib/config";

// The AI draft runs as a server action on this page.
export const maxDuration = 120;

export default function NewPostPage() {
  return <PostEditor post={null} aiReady={aiConfigured()} coversReady={imagesConfigured()} siteUrl={siteUrl} />;
}
