-- Add has_integration to locations table
ALTER TABLE
  sims.institution_locations
ADD
  COLUMN IF NOT EXISTS has_integration BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.institution_locations.has_integration IS 'Identifies if the institution uses integrations.';