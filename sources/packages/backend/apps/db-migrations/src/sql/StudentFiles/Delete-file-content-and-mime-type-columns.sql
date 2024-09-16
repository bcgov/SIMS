-- drop column
ALTER TABLE
  sims.student_files DROP COLUMN mime_type,
  DROP COLUMN file_content;