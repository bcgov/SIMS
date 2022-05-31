-- Add tuition_remittance_requested_amount
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS tuition_remittance_requested_amount INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.disbursement_schedules.tuition_remittance_requested_amount IS 'Tuition remittance Amount Requested';

-- Add tuition_remittance_requested
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS tuition_remittance_requested VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.disbursement_schedules.tuition_remittance_requested IS 'Tuition Remittance Requested like yes, no';