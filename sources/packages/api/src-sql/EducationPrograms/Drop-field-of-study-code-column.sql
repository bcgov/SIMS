-- Drop field_of_study_code
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS field_of_study_code;