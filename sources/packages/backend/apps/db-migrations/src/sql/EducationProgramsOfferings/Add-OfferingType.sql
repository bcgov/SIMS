ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS offering_type sims.offering_types NOT NULL DEFAULT 'Public';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    offering_type DROP DEFAULT;

COMMENT ON COLUMN sims.education_programs_offerings.offering_type IS 'Type of the education offering.';