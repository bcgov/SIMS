-- Remove column submitted_date for applications
ALTER TABLE
  sims.applications DROP COLUMN IF EXISTS submitted_date;