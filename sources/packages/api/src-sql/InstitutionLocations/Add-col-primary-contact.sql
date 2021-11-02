-- Add primary_contact to institution_locations table
ALTER TABLE
    sims.institution_locations
ADD
    COLUMN IF NOT EXISTS primary_contact JSONB NOT NULL DEFAULT '{}' :: jsonb;

COMMENT ON COLUMN sims.institution_locations.primary_contact IS 'Primary contact details of institution location';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
    sims.institution_locations
ALTER COLUMN
    primary_contact DROP DEFAULT;