ALTER TABLE
  sims.student_files
ADD
  COLUMN file_hash CHAR(64);

COMMENT ON COLUMN sims.student_files.file_hash IS 'SHA256 hash of the file contents.';