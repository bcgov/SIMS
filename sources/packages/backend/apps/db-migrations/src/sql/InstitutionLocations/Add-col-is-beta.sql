ALTER TABLE
    sims.institution_locations
ADD
    COLUMN is_beta BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.institution_locations.is_beta IS 'Identifies if the institution location is a beta.';

-- Add column to history table.
ALTER TABLE
    sims.institution_locations_history
ADD
    COLUMN is_beta BOOLEAN;

COMMENT ON COLUMN sims.institution_locations_history.is_beta IS 'Historical data from the original table. See original table comments for details.';