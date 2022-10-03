-- Add field_of_study_code to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS field_of_study_code INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.education_programs.field_of_study_code IS 'Federal field of study code calculated based on the CIP code and the credential type.';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
  sims.education_programs
ALTER COLUMN
  field_of_study_code DROP DEFAULT;