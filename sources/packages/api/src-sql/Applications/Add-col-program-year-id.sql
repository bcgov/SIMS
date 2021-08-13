-- Create program_year_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS program_year_id INT REFERENCES sims.program_years(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.applications.program_year_id IS 'References the program year related to the application, this will be saved only when the ProgramYear is active and the application is Submitted and not in Draft state';