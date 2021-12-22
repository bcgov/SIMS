-- Add restriction_note to student_restrictions table.
ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN IF NOT EXISTS restriction_note INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_restrictions.restriction_note IS 'Note added during restriction creation.';

-- Add resolution_note to student_restrictions table.
ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN IF NOT EXISTS resolution_note INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_restrictions.resolution_note IS 'Note added during restriction resolution.';