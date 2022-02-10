--Removing COE columns from sims.applications as they are obsolete to this table.
ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS coe_status;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS coe_denied_id;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS coe_denied_other_desc;