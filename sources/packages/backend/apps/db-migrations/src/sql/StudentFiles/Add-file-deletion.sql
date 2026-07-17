ALTER TABLE
  sims.student_files
ADD
  COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD
  COLUMN deletion_note_id INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.student_files.deleted_at IS 'Timestamp when the student file was soft deleted.';

COMMENT ON COLUMN sims.student_files.deletion_note_id IS 'Note added during student file deletion.';