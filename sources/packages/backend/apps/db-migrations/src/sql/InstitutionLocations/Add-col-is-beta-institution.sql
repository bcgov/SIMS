ALTER TABLE
    sims.institution_locations
ADD
    COLUMN is_beta_institution BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.institution_locations.is_beta_institution IS 'Identifies if the institution is a beta institution.';