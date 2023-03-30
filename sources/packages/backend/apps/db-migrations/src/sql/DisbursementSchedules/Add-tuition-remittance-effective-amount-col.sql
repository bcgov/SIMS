-- Add tuition_remittance_effective_amount to disbursement_schedules table.
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS tuition_remittance_effective_amount NUMERIC(8, 2);

COMMENT ON COLUMN sims.disbursement_schedules.tuition_remittance_effective_amount IS 'Effective tuition remittance considered for the disbursement evaluated based on awards effective values.';