import { env } from "cloudflare:test";
import { it, expect } from "vitest";

// Smoke test for the toolchain (#3). Proves that:
//  1. Vitest runs inside the Cloudflare Workers runtime (not plain Node), and
//  2. the D1 `DB` binding from wrangler.jsonc is reachable in tests.
// The real analytics tests (#6) build on exactly this harness.
it("boots the workers pool and reaches the D1 binding", async () => {
  const row = await env.DB.prepare("SELECT 1 AS ok").first();
  expect(row.ok).toBe(1);
});
