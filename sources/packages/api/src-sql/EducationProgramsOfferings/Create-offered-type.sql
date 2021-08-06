-- Add the column offered_type for Offering.
ALTER TABLE sims.education_programs_offerings ADD 
    COLUMN IF NOT EXISTS offered_type VARCHAR(50);
COMMENT ON COLUMN sims.education_programs_offerings.offered_type IS 'offered_type decides if offering is Full-Time and Part-Time';
