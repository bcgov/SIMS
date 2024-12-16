ALTER TABLE
  sims.restrictions
ADD
  COLUMN is_legacy BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.restrictions.is_legacy IS 'Indicate that the restriction is a legacy and should not be managed by SIMS, it can only transition to resolved.';

-- Set the existing 'LGCY' restriction to legacy.
UPDATE
  sims.restrictions
SET
  is_legacy = TRUE
WHERE
  restriction_code = 'LGCY';