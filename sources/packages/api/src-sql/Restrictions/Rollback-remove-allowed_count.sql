-- Add column allowed_count.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS allowed_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.restrictions.allowed_count IS 'Allowed count defines the maximum number of times a given restriction can be held by any user';