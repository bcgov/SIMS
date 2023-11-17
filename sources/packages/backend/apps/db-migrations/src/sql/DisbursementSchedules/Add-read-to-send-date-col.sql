ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS ready_to_send_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.disbursement_schedules.ready_to_send_date IS 'Audit column to identify the date-time at which the disbursement calculations are done and ready to be added to an e-Cert.';