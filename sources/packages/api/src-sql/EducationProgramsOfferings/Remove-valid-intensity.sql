-- Remove column valid_intensity
ALTER TABLE
  sims.education_programs_offerings DROP COLUMN IF EXISTS valid_intensity;