-- Analytics event log. Anonymous by design:
--   * no IP column (never stored),
--   * session_id is random per page load (supplied by the client, held only
--     in memory) — not a cookie, not a persistent identifier,
--   * country is coarse geo derived from Cloudflare's edge header.
-- Per-section dwell columns arrive in a later migration (#7).
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  page       TEXT NOT NULL,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id);
