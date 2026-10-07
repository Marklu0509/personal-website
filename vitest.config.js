import { defineConfig } from "vitest/config";

// Static site: tests run in plain Node and read files off disk
// (e.g. the de-index guard that keeps every page noindex).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/node/**/*.test.js"],
  },
});
