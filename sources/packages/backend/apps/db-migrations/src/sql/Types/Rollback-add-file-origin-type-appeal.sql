-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.file_origin_type_to_rollback AS ENUM (
  'Temporary',
  'Application',
  'Student',
  'Ministry'
);

-- DROP default value to allow the enum change (it will be added back in the end of the script).
ALTER TABLE
  sims.student_files
ALTER COLUMN
  file_origin DROP DEFAULT;

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.student_files
ALTER COLUMN
  file_origin TYPE sims.file_origin_type_to_rollback USING (
    CASE
      file_origin :: text
      WHEN 'Appeal' THEN 'Temporary'
      ELSE file_origin :: text
    END
  ) :: sims.file_origin_type_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.file_origin_type;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.file_origin_type_to_rollback RENAME TO file_origin_type;

-- Add back the previously remove default constraint.
ALTER TABLE
  sims.student_files
ALTER COLUMN
  file_origin
SET
  DEFAULT 'Temporary';