ALTER TABLE
    sims.student_restrictions
ADD
    COLUMN resolved_at TIMESTAMP WITH TIME ZONE,
ADD
    COLUMN resolved_by INT REFERENCES sims.users(id),
ADD
    COLUMN deletion_note_id INT REFERENCES sims.notes(id),
ADD
    COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD
    COLUMN deleted_by INT REFERENCES sims.users(id);

COMMENT ON COLUMN sims.student_restrictions.resolved_at IS 'Date when the restriction was resolved.';

COMMENT ON COLUMN sims.student_restrictions.resolved_by IS 'User who resolved the restriction.';

COMMENT ON COLUMN sims.student_restrictions.deletion_note_id IS 'Note added during restriction deletion.';

COMMENT ON COLUMN sims.student_restrictions.deleted_at IS 'Date when the restriction was deleted.';

COMMENT ON COLUMN sims.student_restrictions.deleted_by IS 'User who deleted the restriction.';

-- Update the resolved columns for inactive restrictions
-- following the logic used to return the same from the API.
UPDATE
    sims.student_restrictions
SET
    resolved_at = updated_at,
    resolved_by = modifier
WHERE
    is_active = FALSE;