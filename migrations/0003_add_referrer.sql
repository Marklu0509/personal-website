-- Referrer host on pageview rows (#9 dashboard). Only the external hostname is
-- stored (e.g. "linkedin.com"); same-origin navigation and full URLs are not.
ALTER TABLE events ADD COLUMN referrer TEXT;
