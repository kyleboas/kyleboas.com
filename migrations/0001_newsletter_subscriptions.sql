CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  email TEXT PRIMARY KEY,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'subscribed')),
  source TEXT NOT NULL DEFAULT 'website',
  agent_json TEXT,
  consent_json TEXT NOT NULL,
  tags_json TEXT,
  metadata_json TEXT,
  token_hash TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  confirmed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_token_hash
  ON newsletter_subscriptions (token_hash);
