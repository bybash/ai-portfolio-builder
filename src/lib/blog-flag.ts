import type { Prisma } from "@/generated/prisma/client";
import { resolveFeatures, siteConfig } from "@/lib/config";
import { parseSettings } from "@/lib/site-settings-schema";

// Whether the blog is on, for code that also runs in scripts, where
// getFeatures() (per request, with Next.js's cache) is not available.
export async function blogEnabled(client: Prisma.TransactionClient) {
  const row = await client.siteSettings.findUnique({ where: { id: 1 } });
  return resolveFeatures({ ...siteConfig.features, ...parseSettings(row?.data).features }).blog;
}
