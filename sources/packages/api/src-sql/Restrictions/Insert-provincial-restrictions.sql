-- Add resolution_note_id to student_restrictions table.
ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN IF NOT EXISTS resolution_note_id_1 INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_restrictions.resolution_note_id_1 IS 'Note added during restriction resolution.';