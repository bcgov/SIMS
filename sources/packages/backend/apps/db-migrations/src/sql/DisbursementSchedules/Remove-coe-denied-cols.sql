-- Drop coe_denied_id and coe_denied_other_desc
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS coe_denied_id;

ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS coe_denied_other_desc;