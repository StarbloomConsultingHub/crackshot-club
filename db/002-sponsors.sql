-- Apply as owner once, before enabling SPONSOR_METRICS_ENABLED.
BEGIN;
CREATE TABLE sponsor_daily (
  day date NOT NULL,
  campaign_id text NOT NULL CHECK (length(campaign_id) BETWEEN 1 AND 64),
  placement text NOT NULL CHECK (placement IN ('home', 'smoothbore-hall', 'gallery-hall', 'arcade-lobby')),
  impressions bigint NOT NULL CHECK (impressions > 0),
  PRIMARY KEY (day, campaign_id, placement)
);
CREATE TABLE sponsor_impression_seen (
  id uuid PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
CREATE INDEX sponsor_impression_expiry ON sponsor_impression_seen(expires_at);
CREATE TABLE sponsor_quota (
  bucket text PRIMARY KEY,
  hits integer NOT NULL CHECK (hits > 0),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sponsor_quota_expiry ON sponsor_quota(expires_at);
GRANT SELECT, INSERT, UPDATE (impressions) ON sponsor_daily TO club_web;
GRANT SELECT, INSERT, DELETE ON sponsor_impression_seen TO club_web;
GRANT SELECT, INSERT, DELETE, UPDATE (hits) ON sponsor_quota TO club_web;
COMMIT;
