-- drop default
ALTER TABLE
  sims.student_files
ALTER COLUMN
  group_name DROP DEFAULT;

-- drop column
ALTER TABLE
  sims.student_files DROP COLUMN file_origin;

-- drop column
ALTER TABLE
  sims.student_files DROP COLUMN metadata;