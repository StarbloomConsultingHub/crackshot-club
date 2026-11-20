BEGIN;

CREATE TABLE club_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL CHECK (length(nickname) BETWEEN 2 AND 40),
  pass_hash text UNIQUE NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE club_session (
  token_hash text PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES club_member(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX club_session_expiry ON club_session(expires_at);

CREATE TABLE club_note (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES club_member(id) ON DELETE CASCADE,
  topic text NOT NULL CHECK (topic IN ('Introduction', 'Gallery memory', 'Research lead')),
  body text NOT NULL CHECK (length(body) BETWEEN 10 AND 1200),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);
CREATE INDEX club_note_publication ON club_note(approved_at DESC) WHERE approved_at IS NOT NULL;
CREATE INDEX club_note_author ON club_note(member_id, created_at DESC);

CREATE TABLE club_quota (
  bucket text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX club_quota_expiry ON club_quota(expires_at);

COMMIT;
