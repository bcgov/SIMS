-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN mime_type varchar(250) NOT NULL DEFAULT 'text/plain';

COMMENT ON COLUMN sims.student_files.mime_type IS 'File MIME type.';

-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN file_content bytea NOT NULL DEFAULT 'Deleted';

COMMENT ON COLUMN sims.student_files.file_content IS 'File Content.';

-- drop the default on both the columns
ALTER TABLE
  sims.student_files
ALTER COLUMN
  mime_type DROP DEFAULT,
ALTER COLUMN
  file_content DROP DEFAULT;