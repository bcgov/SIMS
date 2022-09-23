-- Remove column submitted_date for applications
ALTER TABLE
  applications DROP COLUMN IF EXISTS submitted_date;