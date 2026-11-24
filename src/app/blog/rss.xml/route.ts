import { siteConfig, siteUrl } from "@/lib/config";
import { publishedPosts } from "@/lib/posts";
import { getFeatures } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

export async function GET() {
  if (!(await getFeatures()).blog) return new Response("Not found", { status: 404 });
  const items = (await publishedPosts()).map((p) => {
    const url = `${siteUrl}/blog/${p.slug}`;
    return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.publishedAt?.toUTCString() ?? ""}</pubDate><description>${esc(p.summary)}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`${siteConfig.person.name}: ${siteConfig.blog.heading}`)}</title><link>${siteUrl}/blog</link><atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/><description>${esc(siteConfig.blog.intro)}</description><language>en</language>
${items.join("\n")}
</channel></rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
