ALTER TABLE
  sims.student_files
ADD
  COLUMN deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN sims.student_files.deleted_at IS 'Timestamp when the student file was soft deleted.';