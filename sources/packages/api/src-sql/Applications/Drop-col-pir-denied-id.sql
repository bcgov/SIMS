-- Drop pir_denied_id and pir_denied_other_desc
ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS pir_denied_id;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS pir_denied_other_desc;