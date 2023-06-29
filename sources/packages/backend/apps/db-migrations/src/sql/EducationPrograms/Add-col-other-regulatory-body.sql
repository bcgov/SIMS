-- Add other_regulatory_body column to education_programs table
ALTER TABLE
    sims.education_programs
ADD
    COLUMN other_regulatory_body VARCHAR(100);

COMMENT ON COLUMN sims.education_programs.other_regulatory_body IS 'Other regulatory body.';