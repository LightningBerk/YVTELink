-- Migration number: 0003 	 2025-12-17T16:18:45.645Z

ALTER TABLE events ADD COLUMN device TEXT NULL;
ALTER TABLE events ADD COLUMN os TEXT NULL;
ALTER TABLE events ADD COLUMN browser TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_events_device ON events(device, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_os ON events(os, occurred_at);
