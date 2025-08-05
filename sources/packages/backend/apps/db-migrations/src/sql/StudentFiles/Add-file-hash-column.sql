-- Creates the new column with an empty default value to allow it to be defined as NOT NULL.
ALTER TABLE
  sims.student_files
ADD
  COLUMN file_hash CHAR(64) NOT NULL DEFAULT '';

ALTER TABLE
  sims.student_files
ALTER COLUMN
  file_hash DROP DEFAULT;

COMMENT ON COLUMN sims.student_files.file_hash IS 'SHA256 hash of the file contents converted to a hexadecimal string.';