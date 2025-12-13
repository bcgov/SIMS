--As postgres does not support removal of an Enum Value, we create a temporary enum and rename it.
CREATE TYPE sims.coe_status_to_rollback AS ENUM ('Required', 'Completed', 'Declined');

-- Need to drop the default constraint to allow the ALTER column rollback.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status DROP DEFAULT;

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status TYPE sims.coe_status_to_rollback USING (
    CASE
      coe_status :: text
      WHEN 'Not Required' THEN 'Required'
      ELSE coe_status :: text
    END
  ) :: sims.coe_status_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.coe_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.coe_status_to_rollback RENAME TO coe_status;

-- Add the previously removed default constraint.
ALTER TABLE
  sims.disbursement_schedules
ALTER COLUMN
  coe_status
SET
  DEFAULT 'Required';