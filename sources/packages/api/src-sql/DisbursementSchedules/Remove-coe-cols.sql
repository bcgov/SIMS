-- Drop coe_approved
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS coe_approved;

-- Drop coe_updated_by
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS coe_updated_by;

-- Drop coe_updated_at
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS coe_updated_at;