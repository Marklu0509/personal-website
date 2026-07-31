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

const MAX_LEN = 512;

export async function handleTrack(request, env) {
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
      await env.DB.prepare(
        "INSERT INTO events (session_id, page, country) VALUES (?, ?, ?)",
      )
        .bind(session_id, page, country)
        .run();
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
