import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { handleTrack } from "../../src/track.js";

// Build a request-like object the way the Worker passes it to handleTrack.
// `cf.country` stands in for Cloudflare's edge geo header; no IP is ever passed.
function req(bodyObj, { country = "AU", badJson = false } = {}) {
  return {
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
});
