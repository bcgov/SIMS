-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN mime_type varchar(250) NOT NULL;

COMMENT ON COLUMN sims.student_files.mime_type IS 'File MIME type.';

-- add column
ALTER TABLE
  sims.student_files
ADD
  COLUMN file_content bytea NOT NULL;

COMMENT ON COLUMN sims.student_files.file_content IS 'File Content.';