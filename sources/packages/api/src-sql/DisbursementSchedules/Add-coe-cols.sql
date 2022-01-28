-- Add coe_approved to disbursement_schedules table.
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS coe_approved BOOLEAN;

COMMENT ON COLUMN sims.disbursement_schedules.coe_approved IS 'Column which indicates if a COE is approved or not for a disbursement.';

-- Add coe_updated_by to disbursement_schedules table.
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS coe_updated_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.disbursement_schedules.coe_updated_by IS 'Audit column to identify the user who updated the COE.';

-- Add coe_updated_at to disbursement_schedules table.
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS coe_updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.disbursement_schedules.coe_updated_at IS 'Audit column to identify the date-time at which the COE is updated.';