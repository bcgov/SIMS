-- Recreate the enums types when a new item must be added following 
-- the same approach already used for rollbacks.
CREATE TYPE sims.student_files_trigger_file_origin_types_to_be_updated AS ENUM (
  'Temporary',
  'Application',
  'Student',
  'Ministry',
  'Appeal'
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
  file_origin TYPE sims.student_files_trigger_file_origin_types_to_be_updated USING (file_origin :: text) :: sims.student_files_trigger_file_origin_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.file_origin_type;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.student_files_trigger_file_origin_types_to_be_updated RENAME TO file_origin_type;

-- Add back the previously remove default constraint.
ALTER TABLE
  sims.student_files
ALTER COLUMN
  file_origin
SET
  DEFAULT 'Temporary';