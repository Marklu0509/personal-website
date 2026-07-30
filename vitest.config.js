import { defineConfig } from "vitest/config";
import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";

// Two test projects, because they need different runtimes:
//  - "node":    plain Node, for tests that read files off disk
//               (e.g. the de-index guard). The Workers sandbox has no fs.
//  - "workers": the real Cloudflare Workers runtime (via Miniflare), for
//               Pages Functions + D1 tests. Bindings come from wrangler.jsonc.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tests/node/**/*.test.js"],
        },
      },
      defineWorkersProject({
        test: {
          name: "workers",
          include: ["tests/workers/**/*.test.js"],
          poolOptions: {
            workers: { wrangler: { configPath: "./wrangler.jsonc" } },
          },
        },
      }),
    ],
  },
});
