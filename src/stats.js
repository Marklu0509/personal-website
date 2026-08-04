// Private analytics dashboard: GET /stats.
//
// Fails CLOSED: the page only renders for a request that carries a Cloudflare
// Access identity header. Until Access is configured in front of /stats, the
// endpoint returns 403, so data is never exposed publicly.

const ACCESS_HEADER = "cf-access-authenticated-user-email";

export async function handleStats(request, env) {
  const user =
    request.headers && request.headers.get
      ? request.headers.get(ACCESS_HEADER)
      : null;
  if (!user) {
    return html(
      "<h1>Not available</h1><p>This dashboard must sit behind Cloudflare Access. Configure an Access policy for <code>/stats</code>.</p>",
      403,
    );
  }

  if (!env.DB) {
    return html(
      "<h1>Analytics not activated</h1><p>No D1 database is bound yet. Create it and add the binding, then this page will fill in.</p>",
      200,
    );
  }

  const stats = await computeStats(env.DB);
  return html(renderDashboard(stats, user), 200);
}

// Pure-ish aggregation over the events table. Returns a plain object so it can
// be asserted directly in tests without an HTTP layer.
export async function computeStats(db) {
  const pv = (
    await db
      .prepare(
        "SELECT session_id, page, country, referrer FROM events WHERE section IS NULL ORDER BY id",
      )
      .all()
  ).results;

  const sections = (
    await db
      .prepare(
        "SELECT page, section, COUNT(*) AS hits, SUM(dwell_ms) AS total_ms, CAST(ROUND(AVG(dwell_ms)) AS INTEGER) AS avg_ms FROM events WHERE section IS NOT NULL GROUP BY page, section ORDER BY total_ms DESC",
      )
      .all()
  ).results;

  const countBy = (rows, key, skipEmpty) => {
    const m = new Map();
    for (const r of rows) {
      const v = r[key];
      if (skipEmpty && !v) continue;
      m.set(v, (m.get(v) || 0) + 1);
    }
    return [...m.entries()]
      .map(([k, n]) => ({ key: k, count: n }))
      .sort((a, b) => b.count - a.count);
  };

  // Journeys: ordered pages per session, most-recent sessions first.
  const bySession = new Map();
  for (const r of pv) {
    if (!bySession.has(r.session_id)) bySession.set(r.session_id, []);
    bySession.get(r.session_id).push(r.page);
  }
  const journeys = [...bySession.entries()]
    .map(([session_id, pages]) => ({ session_id, pages }))
    .reverse()
    .slice(0, 20);

  return {
    totalViews: pv.length,
    sessions: bySession.size,
    topPages: countBy(pv, "page"),
    referrers: countBy(pv, "referrer", true),
    countries: countBy(pv, "country", true),
    sections,
    journeys,
  };
}

function renderDashboard(s, user) {
  const esc = (v) =>
    String(v == null ? "" : v).replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    );
  const rows = (items, cols) =>
    items.length
      ? items.map((it) => "<tr>" + cols(it) + "</tr>").join("")
      : '<tr><td colspan="9" class="empty">no data yet</td></tr>';

  return `<!doctype html><meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Analytics &middot; Mark Lu</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#1c1d17}
  h1{margin:0 0 .25rem} .who{color:#6b6c63;margin:0 0 2rem}
  h2{margin:2rem 0 .5rem;font-size:1.1rem}
  table{border-collapse:collapse;width:100%;font-size:14px}
  th,td{text-align:left;padding:.4rem .6rem;border-bottom:1px solid #e7e8e2}
  th{color:#6b6c63;font-weight:600} td.n{text-align:right;font-variant-numeric:tabular-nums}
  .empty{color:#9a9b92;font-style:italic}
  .kpis{display:flex;gap:2rem;margin:1rem 0}
  .kpi b{display:block;font-size:1.8rem}
</style>
<h1>Analytics</h1><p class="who">Signed in as ${esc(user)}</p>
<div class="kpis"><div class="kpi"><b>${s.totalViews}</b>pageviews</div><div class="kpi"><b>${s.sessions}</b>sessions</div></div>

<h2>Top pages</h2><table><tr><th>Page</th><th class="n">Views</th></tr>
${rows(s.topPages, (p) => `<td>${esc(p.key)}</td><td class="n">${p.count}</td>`)}</table>

<h2>Section dwell</h2><table><tr><th>Page</th><th>Section</th><th class="n">Hits</th><th class="n">Total s</th><th class="n">Avg s</th></tr>
${rows(s.sections, (r) => `<td>${esc(r.page)}</td><td>${esc(r.section)}</td><td class="n">${r.hits}</td><td class="n">${(r.total_ms / 1000).toFixed(1)}</td><td class="n">${(r.avg_ms / 1000).toFixed(1)}</td>`)}</table>

<h2>Referrers</h2><table><tr><th>From</th><th class="n">Views</th></tr>
${rows(s.referrers, (r) => `<td>${esc(r.key)}</td><td class="n">${r.count}</td>`)}</table>

<h2>Countries</h2><table><tr><th>Country</th><th class="n">Views</th></tr>
${rows(s.countries, (c) => `<td>${esc(c.key)}</td><td class="n">${c.count}</td>`)}</table>

<h2>Recent journeys</h2><table><tr><th>Session</th><th>Path</th></tr>
${rows(s.journeys, (j) => `<td>${esc(j.session_id).slice(0, 8)}</td><td>${esc(j.pages.join(" → "))}</td>`)}</table>`;
}

function html(body, status) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}
