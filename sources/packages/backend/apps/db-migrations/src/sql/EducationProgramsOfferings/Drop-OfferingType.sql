-- Drop education_program_id
ALTER TABLE
  sims.education_programs_offerings DROP COLUMN IF EXISTS offering_type;