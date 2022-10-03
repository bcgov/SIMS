-- Add the column submitted_date for application.
ALTER TABLE
  sims.applications
ADD
  COLUMN IF NOT EXISTS submitted_date TIMESTAMP WITH TIME ZONE;

-- ## Comments
COMMENT ON COLUMN sims.applications.submitted_date IS 'Application submitted date.';