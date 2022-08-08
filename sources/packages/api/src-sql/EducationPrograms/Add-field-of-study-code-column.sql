-- Add field_of_study_code to education_programs table.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN IF NOT EXISTS field_of_study_code VARCHAR(10) NOT NULL;

COMMENT ON COLUMN sims.education_programs.field_of_study_code IS 'Education program field of study code.';