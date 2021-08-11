-- Remove column program_intensity
ALTER TABLE
  sims.education_programs DROP COLUMN IF EXISTS program_intensity;