import Markdown, { defaultUrlTransform, type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { IframeEmbed } from "@/components/iframe-embed";
import { remarkImageMarkers } from "@/lib/post-images";
import { youtubeId } from "@/lib/youtube";

// A post's Markdown as HTML. Raw HTML in the source is not rendered, and
// unsafe link schemes are dropped. Used by the blog page and the admin preview.

type HastNode = { type: string; value?: string; children?: HastNode[] };
const textOf = (node: HastNode): string => node.value ?? node.children?.map(textOf).join("") ?? "";

const components: Components = {
  // The page's own title is the only h1.
  h1: ({ children }) => <h2 className="mt-12 mb-4 text-2xl font-semibold md:text-3xl">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-12 mb-4 text-2xl font-semibold md:text-3xl">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-8 mb-3 text-xl font-semibold">{children}</h3>,
  // A paragraph that is only a YouTube address shows the player.
  p: ({ node, children }) => {
    const video = node ? youtubeId(textOf(node as HastNode)) : null;
    if (video) {
      return (
        <div className="mb-6">
          <IframeEmbed src={`https://www.youtube-nocookie.com/embed/${video}`} title="YouTube video" aspectClassName="aspect-video" />
        </div>
      );
    }
    return <p className="mb-5 leading-relaxed text-foreground/85">{children}</p>;
  },
  a: ({ href, children }) => {
    const external = /^https?:/.test(href ?? "");
    return (
      <a
        href={href}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        className="font-normal break-words text-link underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 leading-relaxed text-foreground/85">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="mb-5 list-decimal space-y-2 pl-6 leading-relaxed text-foreground/85">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="[&>p]:mb-2">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-5 border-l-2 border-link pl-5 text-foreground/85 italic [&>p:last-child]:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
  // eslint-disable-next-line @next/next/no-img-element -- any size, any host
  img: ({ src, alt }) => <img src={src} alt={alt ?? ""} loading="lazy" className="my-2 h-auto max-w-full rounded-lg border border-border" />,
  pre: ({ children }) => (
    <pre
      tabIndex={0}
      className="mb-6 overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-sm leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-sm"
    >
      {children}
    </pre>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
  table: ({ children }) => (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
};

export function PostBody({ body }: { body: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {body}
    </Markdown>
  );
}

// The same article as bare HTML with absolute links, to paste into another
// site's editor. Images become numbered markers, because LinkedIn does not load images
// from links.
export function PostCopySource({ body, siteUrl }: { body: string; siteUrl: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkImageMarkers]}
      components={{ h1: "h2" }}
      urlTransform={(url) => defaultUrlTransform(url.startsWith("/") ? `${siteUrl}${url}` : url)}
    >
      {body}
    </Markdown>
  );
}
