import { describe, it, expect } from "vitest";
import { isBot } from "../../src/filters.js";

const CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

describe("isBot", () => {
  it("treats real browser user-agents as human", () => {
    expect(isBot(CHROME)).toBe(false);
    expect(isBot(IPHONE)).toBe(false);
  });

  it("flags crawlers and automated clients", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "facebookexternalhit/1.1",
      "python-requests/2.31.0",
      "curl/8.4.0",
      "HeadlessChrome/120.0",
      "Slackbot-LinkExpanding 1.0",
    ]) {
      expect(isBot(ua)).toBe(true);
    }
  });

  it("treats a missing user-agent as non-human", () => {
    expect(isBot("")).toBe(true);
    expect(isBot(undefined)).toBe(true);
  });
});
