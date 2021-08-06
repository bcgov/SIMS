-- Add the column valid_intensity for Offering with a dummy default value.
ALTER TABLE sims.education_programs_offerings ADD 
    COLUMN IF NOT EXISTS valid_intensity sims.valid_intensity NOT NULL DEFAULT 'fullTime';
COMMENT ON COLUMN sims.education_programs_offerings.valid_intensity IS 'valid_intensity decides if offering is Full-Time or Part-Time';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.education_programs_offerings
    ALTER COLUMN valid_intensity DROP DEFAULT;