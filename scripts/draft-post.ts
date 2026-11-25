/**
 * Saves a Markdown file as a blog draft, to edit and publish in /admin/posts.
 * For an AI coding agent drafting a post from a conversation. It only creates
 * new drafts; it never changes or publishes an existing post.
 *
 * Usage: npm run post:draft -- post.md
 * The file starts with "# Title", then a one-paragraph summary, then the body.
 */
import "dotenv/config";
import { readFileSync } from "fs";

import { PrismaClient } from "../src/generated/prisma/client";
import { createDbAdapter } from "../src/lib/db-adapter";
import { createDraft } from "../src/lib/post-write";

async function main() {
  const file = process.argv[2];
  const match = file && readFileSync(file, "utf-8").replace(/\r\n/g, "\n").match(/^# (.+)\n+([^\n]+(?:\n[^\n]+)*)\n\s*\n([\s\S]+)$/);
  if (!match) throw new Error('Usage: npm run post:draft -- post.md ("# Title", a summary paragraph, then the body)');
  const prisma = new PrismaClient({ adapter: createDbAdapter() });
  try {
    const post = await createDraft(prisma, { title: match[1], summary: match[2].replace(/\n/g, " "), body: match[3] });
    console.log(`Draft saved: /admin/posts/${post.id}/edit`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
