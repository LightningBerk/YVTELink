-- Migration number: 0002 	 2025-12-17T15:53:21.729Z

ALTER TABLE events ADD COLUMN country TEXT NULL;
ALTER TABLE events ADD COLUMN region TEXT NULL;
ALTER TABLE events ADD COLUMN city TEXT NULL;
ALTER TABLE events ADD COLUMN timezone TEXT NULL;
ALTER TABLE events ADD COLUMN latitude REAL NULL;
ALTER TABLE events ADD COLUMN longitude REAL NULL;

CREATE INDEX IF NOT EXISTS idx_events_country_time ON events(country, occurred_at);
