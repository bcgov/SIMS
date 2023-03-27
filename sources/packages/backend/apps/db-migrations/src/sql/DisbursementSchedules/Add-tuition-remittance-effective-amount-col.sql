-- Add tuition_remittance_effective_amount to disbursement_schedules table.
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS tuition_remittance_effective_amount INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.disbursement_schedules.tuition_remittance_effective_amount IS 'Column which indicates the tuition remittance effective amount of a disbursement.';