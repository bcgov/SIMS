-- Create program_year_id -  The default 2 is the Program Year 2022-2023, this is used to ensure not null constraint. 
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS program_year_id INT NOT NULL REFERENCES sims.program_years(id) DEFAULT 2;

COMMENT ON COLUMN sims.applications.program_year_id IS 'References the program year related to the application, this will be saved only when the ProgramYear is active.';

--Default constraint for the program_year_id is removed after the not null constraint is enforced
ALTER TABLE
    sims.applications
ALTER
    COLUMN program_year_id DROP DEFAULT;    