import { applyD1Migrations, env } from "cloudflare:test";

// Apply the real D1 migrations to each test's isolated database, so tests run
// against the same schema production uses. Idempotent.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
