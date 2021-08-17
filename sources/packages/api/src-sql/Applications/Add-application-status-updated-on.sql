ALTER TABLE
  sims.applications
ADD
  COLUMN IF NOT EXISTS application_status_updated_on timestamp with time zone NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.applications.application_status_updated_on IS 'Application Status updated on info';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
  sims.applications
ALTER COLUMN
  application_status_updated_on DROP DEFAULT;