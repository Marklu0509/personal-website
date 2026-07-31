import { env } from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import { onRequestPost } from "../../functions/track.js";

// Build a request-like context the way a Cloudflare Pages Function receives it.
// `cf.country` stands in for Cloudflare's edge geo header; no IP is ever passed.
function ctx(bodyObj, { country = "AU", badJson = false } = {}) {
  const request = {
    json: () =>
      badJson ? Promise.reject(new Error("bad")) : Promise.resolve(bodyObj),
    cf: { country },
  };
  return { request, env };
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
    const res = await onRequestPost(
      ctx({ session_id: "abc123", page: "/project-myopia.html" }),
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
    await onRequestPost(ctx({ session_id: "s", page: "/" }, { country: "JP" }));
    const all = await rows();
    expect(all[0].country).toBe("JP");
  });

  it("never stores an IP column", async () => {
    await onRequestPost(ctx({ session_id: "s", page: "/" }));
    const info = await env.DB.prepare("PRAGMA table_info(events)").all();
    const columns = info.results.map((c) => c.name);
    expect(columns).not.toContain("ip");
    expect(columns).not.toContain("ip_address");
  });

  it("rejects malformed JSON with 400 and writes nothing", async () => {
    const res = await onRequestPost(ctx(null, { badJson: true }));
    expect(res.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });

  it("rejects a payload missing page with 400 and writes nothing", async () => {
    const res = await onRequestPost(ctx({ session_id: "only" }));
    expect(res.status).toBe(400);
    expect(await rows()).toHaveLength(0);
  });
});
