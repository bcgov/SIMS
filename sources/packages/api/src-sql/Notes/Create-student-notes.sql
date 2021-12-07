CREATE TABLE IF NOT EXISTS sims.student_notes (
    student_id INT NOT NULL REFERENCES sims.students(id),
    note_id INT NOT NULL REFERENCES sims.notes(id)
);

-- Comments for table and column
COMMENT ON TABLE sims.student_notes IS 'Table that holds many to many mapping for student notes.';

COMMENT ON COLUMN sims.student_notes.institution_id IS 'Reference to student id in students table.';

COMMENT ON COLUMN sims.student_notes.note_id IS 'Reference to note id in notes table.';