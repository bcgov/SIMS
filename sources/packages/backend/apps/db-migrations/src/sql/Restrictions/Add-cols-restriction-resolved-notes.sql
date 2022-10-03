-- Add restriction_note_id to student_restrictions table.
ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN IF NOT EXISTS restriction_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_restrictions.restriction_note_id IS 'Note added during restriction creation.';

-- Add resolution_note_id to student_restrictions table.
ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN IF NOT EXISTS resolution_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_restrictions.resolution_note_id IS 'Note added during restriction resolution.';