ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS msfaa_number_id INT REFERENCES sims.msfaa_numbers(id);

COMMENT ON COLUMN sims.applications.msfaa_number_id IS 'MSFAA number associated with this application.';