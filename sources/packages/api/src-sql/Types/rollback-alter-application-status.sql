-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.application_status_to_rollback AS ENUM (
  'Draft',
  'In Progress',
  'Assessment',
  'Enrollment',
  'Completed',
  'Cancelled',
  'Submitted'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.applications
ALTER COLUMN
  application_status TYPE sims.application_status_to_rollback USING CASE
    WHEN application_status = 'Overwritten' THEN 'Submitted' :: sims.application_status_to_rollback
  END;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.application_status;

-- Rename the enum to what it was in the begining.
ALTER TYPE sims.application_status_to_rollback RENAME TO application_status;