-- Remove column application_number for applications
ALTER TABLE applications DROP 
  COLUMN IF EXISTS application_number;