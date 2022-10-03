-- Remove column offering_intensity
ALTER TABLE
  sims.education_programs_offerings DROP COLUMN IF EXISTS offering_intensity;