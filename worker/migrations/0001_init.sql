-- D1 (SQLite) schema for analytics events
CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  link_id TEXT NULL,
  label TEXT NULL,
  destination_url TEXT NULL,
  referrer TEXT NULL,
  utm_source TEXT NULL,
  utm_medium TEXT NULL,
  utm_campaign TEXT NULL,
  utm_content TEXT NULL,
  utm_term TEXT NULL,
  user_agent TEXT NOT NULL,
  is_bot INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_events_name_time ON events(event_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_link_time ON events(link_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_visitor_time ON events(visitor_id, occurred_at);
