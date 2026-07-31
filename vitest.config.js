import { defineConfig } from "vitest/config";
import {
  defineWorkersProject,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

// Read the D1 migration files at config load; the workers project applies them
// to each test's isolated database via a setup file.
const migrations = await readD1Migrations("./migrations");

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
          setupFiles: ["./tests/workers/apply-migrations.js"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "./wrangler.jsonc" },
              miniflare: {
                // Local test-only D1 bound as `DB`. Production binds its own
                // D1 via wrangler.jsonc once the database is created (#10).
                d1Databases: { DB: "analytics-test" },
                bindings: { TEST_MIGRATIONS: migrations },
              },
            },
          },
        },
      }),
    ],
  },
});
