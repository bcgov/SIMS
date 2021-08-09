-- Add the column program_intensity for Program with a dummy default value.
ALTER TABLE sims.education_programs ADD 
    COLUMN IF NOT EXISTS program_intensity sims.program_intensity NOT NULL DEFAULT 'Full Time';
COMMENT ON COLUMN sims.education_programs.program_intensity IS 'If program_intensity is Full Time and Part Time, then the program is both Full-Time and Part-Time, if program_intensity is Full Time, then the program is only Full-Time basis';


-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.education_programs
    ALTER COLUMN program_intensity DROP DEFAULT;