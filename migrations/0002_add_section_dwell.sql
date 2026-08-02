-- Per-section dwell (#7). A pageview row keeps section/dwell_ms NULL; a dwell
-- row carries a section name and the milliseconds of attention it received.
-- A session's page journey is still reconstructed by ordering its rows by
-- created_at; dwell rows hang off the same session_id + page.
ALTER TABLE events ADD COLUMN section TEXT;
ALTER TABLE events ADD COLUMN dwell_ms INTEGER;
