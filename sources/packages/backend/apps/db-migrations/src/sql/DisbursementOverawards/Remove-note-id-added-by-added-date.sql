-- Remove column note_id from sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards DROP COLUMN IF EXISTS note_id;

-- Remove column added_by from sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards DROP COLUMN IF EXISTS added_by;

-- Remove column added_date from sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards DROP COLUMN IF EXISTS added_date;