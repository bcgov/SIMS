ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS note_id INTEGER REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.disbursement_overawards.note_id IS 'Note id for the disbursement overaward record.';

ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS added_by INTEGER REFERENCES sims.users(id);

COMMENT ON COLUMN sims.disbursement_overawards.added_by IS 'User id of the user adding a manual record.';

ALTER TABLE
    sims.disbursement_overawards
ADD
    COLUMN IF NOT EXISTS added_date TIMESTAMP WITHOUT TIME ZONE;

COMMENT ON COLUMN sims.disbursement_overawards.added_date  IS 'Date that the manual record was added.';