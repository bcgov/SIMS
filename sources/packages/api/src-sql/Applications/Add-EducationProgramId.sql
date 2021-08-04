-- Create education_program_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS education_program_id INT REFERENCES sims.education_programs(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.applications.location_id IS 'References the program related to the application. For applications that do not have an offering defined yet (need a PIR) this is the way to figure out the related program.';