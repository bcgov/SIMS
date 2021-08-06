-- Add the column offered_type for Offering with a dummy default value.
ALTER TABLE sims.education_programs_offerings ADD 
    COLUMN IF NOT EXISTS offered_type VARCHAR(50) NOT NULL DEFAULT 'fullTime';
COMMENT ON COLUMN sims.education_programs_offerings.offered_type IS 'offered_type decides if offering is Full-Time and Part-Time';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.education_programs_offerings
    ALTER COLUMN offered_type DROP DEFAULT;