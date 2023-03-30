ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS msfaa_number_id INT REFERENCES sims.msfaa_numbers(id);

COMMENT ON COLUMN sims.disbursement_schedules.msfaa_number_id IS 'MSFAA number associated with the disbursement.';