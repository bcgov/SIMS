-- Add column note_id to sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.disbursement_overawards.note_id IS 'Note id for the disbursement overaward record.';

-- Add column added_by to sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS added_by INT REFERENCES sims.users(id);

COMMENT ON COLUMN sims.disbursement_overawards.added_by IS 'User id of the user adding a manual record.';

-- Add column added_date to sims.disbursement_overawards.
ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS added_date TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN sims.disbursement_overawards.added_date IS 'Date that the manual record was added.';