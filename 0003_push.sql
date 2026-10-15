-- Mídia (músicas / arquivos) — metadados no D1; bytes no R2 (binding MEDIA)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT DEFAULT '',
  mime TEXT DEFAULT 'application/octet-stream',
  size INTEGER DEFAULT 0,
  kind TEXT DEFAULT 'music',
  duration INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_media_profile ON media(profile_id);
CREATE INDEX IF NOT EXISTS idx_media_kind ON media(kind);
