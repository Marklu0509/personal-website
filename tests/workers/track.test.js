import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { handleTrack } from "../../src/track.js";

// Build a request-like object the way the Worker passes it to handleTrack.
// `cf.country` stands in for Cloudflare's edge geo header; no IP is ever passed.
const HUMAN_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function req(bodyObj, { country = "AU", badJson = false, ua = HUMAN_UA } = {}) {
  return {
    headers: { get: (h) => (h.toLowerCase() === "user-agent" ? ua : null) },
    json: () =>
      badJson ? Promise.reject(new Error("bad")) : Promise.resolve(bodyObj),
    cf: { country },
  };
}

async function rows() {
  const res = await env.DB.prepare(
    "SELECT session_id, page, country FROM events ORDER BY id",
  ).all();
  return res.results;
}

describe("POST /track ingestion", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM events").run();
  });

  it("writes one anonymized row for a valid pageview", async () => {
    const res = await handleTrack(
      req({ session_id: "abc123", page: "/project-myopia.html" }),
      env,
    );
    expect(res.status).toBe(204);

    const all = await rows();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual({
      session_id: "abc123",
      page: "/project-myopia.html",
      country: "AU",
    });
  });

  it("derives country from the edge header, not from any IP", async () => {
    await handleTrack(req({ session_id: "s", page: "/" }, { country: "JP" }), env);
    const all = await rows();
    expect(all[0].country).toBe("JP");
  });

  it("never stores an IP column", async () => {
    await handleTrack(req({ session_id: "s", page: "/" }), env);
    const info = await env.DB.prepare("PRAGMA table_info(events)").all();
    const columns = info.results.map((c) => c.name);
    expect(columns).not.toContain("ip");
    expect(columns).not.toContain("ip_address");
  });

  it("rejects malformed JSON with 400 and writes nothing", async () => {
    const res = await handleTrack(req(null, { badJson: true }), env);
    expect(res.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects a payload missing page with 400 and writes nothing", async () => {
    const res = await handleTrack(req({ session_id: "only" }), env);
    expect(res.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it("stores nothing (and does not throw) when the D1 binding is absent", async () => {
    const res = await handleTrack(req({ session_id: "s", page: "/" }), {});
    expect(res.status).toBe(204);
  });

  it("writes one row per section for a batched dwell payload", async () => {
    const res = await handleTrack(
      req({
        session_id: "sess1",
        page: "/index.html",
        sections: [
          { section: "about", dwell_ms: 4200 },
          { section: "experience", dwell_ms: 1800 },
        ],
      }),
      env,
    );
    expect(res.status).toBe(204);

    const out = await env.DB.prepare(
      "SELECT session_id, page, section, dwell_ms FROM events ORDER BY section",
    ).all();
    expect(out.results).toEqual([
      { session_id: "sess1", page: "/index.html", section: "about", dwell_ms: 4200 },
      { session_id: "sess1", page: "/index.html", section: "experience", dwell_ms: 1800 },
    ]);
  });

  it("skips invalid section entries and rounds dwell", async () => {
    await handleTrack(
      req({
        session_id: "s",
        page: "/",
        sections: [
          { section: "ok", dwell_ms: 10.7 },
          { section: "bad", dwell_ms: -5 },
          { section: 123, dwell_ms: 100 },
          { dwell_ms: 100 },
        ],
      }),
      env,
    );
    const out = await env.DB.prepare(
      "SELECT section, dwell_ms FROM events",
    ).all();
    expect(out.results).toEqual([{ section: "ok", dwell_ms: 11 }]);
  });

  it("drops bot/crawler user-agents and writes nothing", async () => {
    const res = await handleTrack(
      req({ session_id: "b", page: "/" }, { ua: "Googlebot/2.1" }),
      env,
    );
    expect(res.status).toBe(204);
    expect(await rows()).toHaveLength(0);
  });

  it("drops requests with no user-agent and writes nothing", async () => {
    const res = await handleTrack(req({ session_id: "b", page: "/" }, { ua: "" }), env);
    expect(res.status).toBe(204);
    expect(await rows()).toHaveLength(0);
  });

  it("reconstructs a session's page journey in order", async () => {
    await handleTrack(req({ session_id: "j", page: "/index.html" }), env);
    await handleTrack(req({ session_id: "j", page: "/projects.html" }), env);
    await handleTrack(req({ session_id: "j", page: "/project-myopia.html" }), env);

    const out = await env.DB.prepare(
      "SELECT page FROM events WHERE session_id = 'j' AND section IS NULL ORDER BY id",
    ).all();
    expect(out.results.map((r) => r.page)).toEqual([
      "/index.html",
      "/projects.html",
      "/project-myopia.html",
    ]);
  });
});
