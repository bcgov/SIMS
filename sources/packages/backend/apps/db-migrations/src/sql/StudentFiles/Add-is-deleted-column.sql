ALTER TABLE
  sims.student_files
ADD
  COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.student_files.is_deleted IS 'Indicates if the student file has been soft deleted.';