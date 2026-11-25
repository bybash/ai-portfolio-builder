import { createHash, timingSafeEqual } from "crypto";

import { features } from "@/lib/config";

const MIN_TOKEN_LENGTH = 32;

const digest = (value: string) => createHash("sha256").update(value).digest();

/** The private MCP server exists only with the admin on and a long ADMIN_MCP_TOKEN. */
export function adminMcpEnabled() {
  return features.admin && (process.env.ADMIN_MCP_TOKEN?.trim().length ?? 0) >= MIN_TOKEN_LENGTH;
}

export function adminMcpAuthorized(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  const expected = process.env.ADMIN_MCP_TOKEN?.trim();
  return Boolean(token && expected) && timingSafeEqual(digest(token!), digest(expected!));
}
