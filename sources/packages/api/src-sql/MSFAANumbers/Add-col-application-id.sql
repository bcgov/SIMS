-- Create  -  The default 2 just a placeholder, this is used to ensure not null constraint. 
ALTER TABLE
    sims.msfaa_numbers
ADD
    COLUMN IF NOT EXISTS reference_application_id INT REFERENCES sims.applications(id);

COMMENT ON COLUMN sims.msfaa_numbers.reference_application_id IS 'References the application that generates the MSFAA Number.';