import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Repo root (two levels up from tests/node/).
const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (name) => readFileSync(new URL(name, `file://${root}`), "utf8");

const htmlPages = readdirSync(root).filter((f) => f.endsWith(".html"));

// Guard for ticket #4 (unlist from search). If any page loses its noindex, or
// the header/robots config regresses, CI goes red before it can be deployed.
describe("the site stays unlisted from search", () => {
  it("has HTML pages to check", () => {
    expect(htmlPages.length).toBeGreaterThan(0);
  });

  it.each(htmlPages)("%s declares noindex", (page) => {
    const html = read(page);
    expect(html).toMatch(
      /<meta\s+name="robots"\s+content="noindex,\s*nofollow">/i,
    );
  });

  it("_headers emits X-Robots-Tag: noindex", () => {
    expect(read("_headers")).toMatch(/X-Robots-Tag:\s*noindex/i);
  });

  it("robots.txt allows crawling so the noindex can be seen", () => {
    const robots = read("robots.txt");
    expect(robots).toMatch(/Allow:\s*\//i);
    // A blanket Disallow would hide the pages from crawlers, so they'd never
    // read the noindex — the classic mistake this guard exists to prevent.
    expect(robots).not.toMatch(/^\s*Disallow:\s*\/\s*$/im);
  });
});
