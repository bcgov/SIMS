-- Recreate the enums types when the new item must be added.
CREATE TYPE sims.disbursement_schedule_status_to_be_updated AS ENUM (
    'Pending',
    'Ready to send',
    'Sent',
    'Cancelled',
    'Rejected'
);

-- Needs to drop the default constraint to allow the ALTER column.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status DROP DEFAULT;

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status TYPE sims.disbursement_schedule_status_to_be_updated USING (disbursement_schedule_status :: text) :: sims.disbursement_schedule_status_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.disbursement_schedule_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.disbursement_schedule_status_to_be_updated RENAME TO disbursement_schedule_status;

-- Add the previously removed default constraint.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status
SET
    DEFAULT 'Pending';