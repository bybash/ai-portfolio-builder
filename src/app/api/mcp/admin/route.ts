// The owner's private MCP server: lets Claude Code (or another MCP client)
// write blog drafts. Separate from the public /api/mcp. On purpose it has no
// tool to publish, unpublish, delete or change a live post: a person does that
// in /admin after reading the draft.
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { adminMcpAuthorized, adminMcpEnabled } from "@/lib/admin-mcp-auth";
import { imagesConfigured } from "@/lib/ai-env";
import { siteConfig, siteUrl } from "@/lib/config";
import { generateCoverImage } from "@/lib/post-cover-ai";
import { postSchema } from "@/lib/post-schema";
import { createDraft } from "@/lib/post-write";
import { prisma } from "@/lib/prisma";
import { clientIp, featureOff, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const maxDuration = 120;

const HOUR = 60 * 60_000;

const ok = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
const fail = (text: string) => ({ isError: true, content: [{ type: "text" as const, text }] });

// On localhost, links go to localhost rather than the live site.
const origin = process.env.NODE_ENV === "production" ? siteUrl : `http://localhost:${process.env.PORT || 3000}`;
const editUrl = (id: string) => `${origin}/admin/posts/${id}/edit`;
const NOT_A_DRAFT = "No draft with that id. Live posts can only be changed in the admin.";

const bodyHelp =
  "Markdown. Open with a paragraph, use ## for sections, no # title. A YouTube address alone on a line shows the player. Mark anything you don't know as [TODO: what is needed].";

function problem(e: unknown) {
  if (e instanceof z.ZodError) return fail(e.issues[0].message);
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail("That slug is already in use.");
  console.error("Admin MCP tool failed", e);
  return fail("That failed. See the server log.");
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_posts",
      {
        title: "List blog posts",
        description: "All drafts and live posts, newest first, without their text.",
        inputSchema: z.object({}),
        annotations: { readOnlyHint: true },
      },
      async () => {
        const posts = await prisma.post.findMany({
          orderBy: { updatedAt: "desc" },
          select: { id: true, slug: true, title: true, summary: true, status: true, publishedAt: true, updatedAt: true },
        });
        return ok(posts);
      },
    );

    server.registerTool(
      "get_post",
      {
        title: "Read a blog post",
        description: "One post with its Markdown text, by id or slug.",
        inputSchema: z.object({ idOrSlug: z.string().min(1) }),
        annotations: { readOnlyHint: true },
      },
      async ({ idOrSlug }) => {
        const post = await prisma.post.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
        return post ? ok({ ...post, editUrl: editUrl(post.id) }) : fail("No post with that id or slug.");
      },
    );

    server.registerTool(
      "create_draft",
      {
        title: "Create a blog draft",
        description: `Saves a new draft for ${siteConfig.person.name} to review. It is never public: publishing happens by hand in the admin. Use only facts ${siteConfig.person.name} gave you or that are already public, and write without em or en dashes. ${siteConfig.blog.draftRules}`,
        inputSchema: z.object({
          title: z.string(),
          summary: z.string().describe("One sentence for search results and share cards, under 200 characters."),
          body: z.string().describe(bodyHelp),
          tags: z.array(z.string()).optional().describe("2 to 5 tags."),
          slug: z.string().optional().describe("Made from the title when left out."),
        }),
      },
      async ({ title, summary, body, tags, slug }) => {
        try {
          const post = await createDraft(prisma, { title, summary, body, tags, slug });
          return ok({ id: post.id, status: post.status, editUrl: editUrl(post.id) });
        } catch (e) {
          return problem(e);
        }
      },
    );

    server.registerTool(
      "update_draft",
      {
        title: "Update a blog draft",
        description: "Replaces the given fields of an unpublished draft. Read it first with get_post, because it may have been edited by hand. Live posts are refused.",
        inputSchema: z.object({
          id: z.string(),
          title: z.string().optional(),
          summary: z.string().optional(),
          body: z.string().optional().describe(bodyHelp),
          tags: z.array(z.string()).optional(),
        }),
      },
      async ({ id, ...fields }) => {
        try {
          const data = postSchema.pick({ title: true, summary: true, body: true, tags: true }).partial().parse(fields);
          if (Object.values(data).every((v) => v === undefined)) return fail("Nothing to change.");
          // One statement, so a post published meanwhile is not touched.
          const { count } = await prisma.post.updateMany({ where: { id, status: "draft" }, data });
          return count ? ok({ id, status: "draft", editUrl: editUrl(id) }) : fail(NOT_A_DRAFT);
        } catch (e) {
          return problem(e);
        }
      },
    );

    if (imagesConfigured()) {
      server.registerTool(
        "make_cover",
        {
          title: "Draw a cover for a draft",
          description:
            "Draws an AI cover and puts it on a draft, replacing its current cover. Costs a few cents of the owner's credit, so call it only when asked. Describe one scene: one main subject doing one thing in a specific place, with a light source. No diagrams, text or real people.",
          inputSchema: z.object({ id: z.string(), scene: z.string().min(10).max(1000) }),
        },
        async ({ id, scene }) => {
          try {
            const post = await prisma.post.findFirst({ where: { id, status: "draft" } });
            if (!post) return fail(NOT_A_DRAFT);
            if (!rateLimit("admin-mcp-cover", "all", 10, HOUR)) return fail("10 covers an hour is the limit. Try again later.");
            const cover = await generateCoverImage({ title: post.title, summary: post.summary, idea: scene });
            const { count } = await prisma.post.updateMany({ where: { id, status: "draft" }, data: { coverImageUrl: cover.url } });
            return count ? ok({ id, coverImageUrl: cover.url, costUsd: cover.cost, editUrl: editUrl(id) }) : fail(NOT_A_DRAFT);
          } catch (e) {
            return problem(e);
          }
        },
      );
    }
  },
  { serverInfo: { name: `${siteConfig.mcp.serverName}-admin`, version: "1.0.0" } },
);

async function guarded(request: Request) {
  if (!adminMcpEnabled()) return featureOff();
  if (!adminMcpAuthorized(request)) {
    if (!rateLimit("admin-mcp-denied", clientIp(request.headers), 10, 60_000)) return tooManyRequests();
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  return handler(request);
}

export { guarded as GET, guarded as POST };
