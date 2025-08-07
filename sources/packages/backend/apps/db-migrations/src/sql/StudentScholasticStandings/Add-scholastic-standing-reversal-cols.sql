ALTER TABLE
    sims.student_scholastic_standings
ADD
    COLUMN reversal_by INT REFERENCES sims.users(id),
ADD
    COLUMN reversal_date TIMESTAMP WITH TIME ZONE,
ADD
    COLUMN reversal_note INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_scholastic_standings.reversal_by IS 'User who reversed the scholastic standing.';

COMMENT ON COLUMN sims.student_scholastic_standings.reversal_date IS 'Date and time when the scholastic standing was reversed.';

COMMENT ON COLUMN sims.student_scholastic_standings.reversal_note IS 'Note added by the ministry user during scholastic standing reversal.';