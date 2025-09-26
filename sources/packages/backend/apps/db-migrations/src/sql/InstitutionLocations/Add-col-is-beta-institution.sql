ALTER TABLE
    sims.institution_locations
ADD
    COLUMN is_beta_institution BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.institution_locations.is_beta_institution IS 'Identifies if the institution is a beta institution.';

-- Add column to history table.
ALTER TABLE
    sims.institution_locations_history
ADD
    COLUMN is_beta_institution BOOLEAN;

COMMENT ON COLUMN sims.institution_locations_history.is_beta_institution IS 'Historical data from the original table. See original table comments for details.';