-- Drop coe_denied_id and coe_denied_other_desc
ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS coe_denied_id;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS coe_denied_other_desc;