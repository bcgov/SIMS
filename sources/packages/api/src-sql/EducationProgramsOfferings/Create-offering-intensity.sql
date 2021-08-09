-- Add the column offering_intensity for Offering with a dummy default value.
ALTER TABLE sims.education_programs_offerings ADD 
    COLUMN IF NOT EXISTS offering_intensity sims.offering_intensity NOT NULL DEFAULT 'Full Time';
COMMENT ON COLUMN sims.education_programs_offerings.offering_intensity IS 'offering_intensity decides if offering is Full-Time or Part-Time';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.education_programs_offerings
    ALTER COLUMN offering_intensity DROP DEFAULT;