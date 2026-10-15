-- Web Push subscriptions (um aparelho = uma linha)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_profile ON push_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
