-- Remove column offered_type
ALTER TABLE
  sims.education_programs_offerings DROP COLUMN IF EXISTS offered_type;