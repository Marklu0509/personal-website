import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Runs tests INSIDE the real Cloudflare Workers runtime (via Miniflare),
// not plain Node — so a test can call a Pages Function and hit a local D1
// exactly like production would. Bindings come from wrangler.jsonc.
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.jsonc" },
      },
    },
  },
});
