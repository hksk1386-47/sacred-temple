-- Sacred Temple — schema inicial (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_color TEXT DEFAULT '#e8e0ff',
  photo_url TEXT DEFAULT '',
  google_sub TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  text TEXT DEFAULT '',
  external_link TEXT DEFAULT '',
  media_kind TEXT DEFAULT '',
  media_url TEXT DEFAULT '',
  pinned INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);

CREATE TABLE IF NOT EXISTS post_reactions (
  post_id TEXT NOT NULL,
  reaction_key TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (post_id, reaction_key),
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE IF NOT EXISTS apoio (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES profiles(id),
  FOREIGN KEY (to_id) REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_apoio_to ON apoio(to_id);
CREATE INDEX IF NOT EXISTS idx_apoio_from ON apoio(from_id);

CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL
);
