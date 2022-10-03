-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.coe_status_to_rollback AS ENUM (
  'Required',
  'Not Required',
  'Completed',
  'Declined'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.applications
ALTER COLUMN
  coe_status TYPE sims.coe_status_to_rollback USING CASE
    WHEN coe_status = 'Submitted' THEN 'Completed' :: sims.coe_status_to_rollback
  END;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.coe_status;

-- Rename the enum to what it was in the begining.
ALTER TYPE sims.coe_status_to_rollback RENAME TO coe_status;