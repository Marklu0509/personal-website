// Ingestion logic for cookieless, anonymous analytics: POST /track.
//
// Privacy invariants (enforced here from the first row):
//   * No IP is ever read or stored.
//   * `country` comes only from Cloudflare's edge header (request.cf.country).
//   * `session_id` is supplied by the client: random per page load, held in
//     memory, never a cookie or server-set identifier.
//
// Fails safe: a visitor beacon never sees a storage error, and when the D1
// binding is absent (before activation) it simply stores nothing.

import { isBot } from "./filters.js";

const MAX_LEN = 512;

export async function handleTrack(request, env) {
  const ua =
    (request.headers && request.headers.get && request.headers.get("user-agent")) ||
    "";
  if (isBot(ua)) {
    // Drop bots/crawlers silently; keep human engagement data clean.
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const session_id =
    typeof body?.session_id === "string" ? body.session_id.slice(0, MAX_LEN) : null;
  const page = typeof body?.page === "string" ? body.page.slice(0, MAX_LEN) : null;

  if (!session_id || !page) {
    return json({ error: "missing session_id or page" }, 400);
  }

  const country = request.cf?.country ?? null;

  try {
    if (env.DB) {
      if (Array.isArray(body.sections)) {
        // Batched per-section dwell: one row per section.
        const stmt = env.DB.prepare(
          "INSERT INTO events (session_id, page, country, section, dwell_ms) VALUES (?, ?, ?, ?, ?)",
        );
        const inserts = [];
        for (const s of body.sections) {
          const section =
            typeof s?.section === "string" ? s.section.slice(0, MAX_LEN) : null;
          const dwell_ms = Number(s?.dwell_ms);
          if (!section || !Number.isFinite(dwell_ms) || dwell_ms < 0) continue;
          inserts.push(
            stmt.bind(session_id, page, country, section, Math.round(dwell_ms)),
          );
        }
        if (inserts.length) await env.DB.batch(inserts);
      } else {
        // Pageview.
        const referrer =
          typeof body.referrer === "string" && body.referrer
            ? body.referrer.slice(0, MAX_LEN)
            : null;
        await env.DB.prepare(
          "INSERT INTO events (session_id, page, country, referrer) VALUES (?, ?, ?, ?)",
        )
          .bind(session_id, page, country, referrer)
          .run();
      }
    }
  } catch {
    // Never surface storage failures to the visitor.
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
