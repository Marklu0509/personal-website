import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { computeStats, handleStats } from "../../src/stats.js";

function statsReq(accessEmail) {
  return {
    headers: {
      get: (h) =>
        h.toLowerCase() === "cf-access-authenticated-user-email"
          ? accessEmail || null
          : null,
    },
  };
}

async function pageview(session, page, { country = "AU", referrer = null } = {}) {
  await env.DB.prepare(
    "INSERT INTO events (session_id, page, country, referrer) VALUES (?, ?, ?, ?)",
  )
    .bind(session, page, country, referrer)
    .run();
}
async function dwell(session, page, section, ms) {
  await env.DB.prepare(
    "INSERT INTO events (session_id, page, country, section, dwell_ms) VALUES (?, ?, 'AU', ?, ?)",
  )
    .bind(session, page, section, ms)
    .run();
}

describe("computeStats", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM events").run();
  });

  it("returns zeroes on an empty table", async () => {
    const s = await computeStats(env.DB);
    expect(s.totalViews).toBe(0);
    expect(s.sessions).toBe(0);
    expect(s.topPages).toEqual([]);
    expect(s.journeys).toEqual([]);
  });

  it("aggregates pageviews, referrers, countries, and journeys", async () => {
    await pageview("A", "/index.html", { referrer: "linkedin.com" });
    await pageview("A", "/projects.html");
    await pageview("B", "/index.html", { country: "JP" });
    await dwell("A", "/index.html", "about", 4000);
    await dwell("B", "/index.html", "about", 2000);
    await dwell("A", "/index.html", "experience", 1500);

    const s = await computeStats(env.DB);

    expect(s.totalViews).toBe(3);
    expect(s.sessions).toBe(2);
    expect(s.topPages).toEqual([
      { key: "/index.html", count: 2 },
      { key: "/projects.html", count: 1 },
    ]);
    expect(s.referrers).toEqual([{ key: "linkedin.com", count: 1 }]);
    expect(s.countries).toEqual([
      { key: "AU", count: 2 },
      { key: "JP", count: 1 },
    ]);
    // about was seen twice for 6000ms total; experience once for 1500ms.
    expect(s.sections[0]).toMatchObject({
      section: "about",
      hits: 2,
      total_ms: 6000,
      avg_ms: 3000,
    });
    const jA = s.journeys.find((j) => j.session_id === "A");
    expect(jA.pages).toEqual(["/index.html", "/projects.html"]);
  });
});

describe("handleStats access guard", () => {
  it("returns 403 without a Cloudflare Access identity", async () => {
    const res = await handleStats(statsReq(null), env);
    expect(res.status).toBe(403);
  });

  it("renders the dashboard for an authenticated user", async () => {
    await env.DB.prepare("DELETE FROM events").run();
    await pageview("Z", "/index.html", { referrer: "linkedin.com" });
    const res = await handleStats(statsReq("marklu0509@gmail.com"), env);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Analytics");
    expect(body).toContain("marklu0509@gmail.com");
    expect(body).toContain("linkedin.com");
  });

  it("says 'not activated' when no DB is bound, even when authenticated", async () => {
    const res = await handleStats(statsReq("marklu0509@gmail.com"), {});
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("not activated");
  });
});
