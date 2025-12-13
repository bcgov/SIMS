-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.coe_status_to_be_updated AS ENUM (
  'Required',
  'Completed',
  'Declined',
  'Not Required'
);

-- Need to drop the default constraint to allow the ALTER column.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status DROP DEFAULT;

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status TYPE sims.coe_status_to_be_updated USING (coe_status :: TEXT) :: sims.coe_status_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.coe_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.coe_status_to_be_updated RENAME TO coe_status;

-- Add the previously removed default constraint.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status
SET
  DEFAULT 'Not Required';