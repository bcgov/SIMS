-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.disbursement_schedule_status_rollback AS ENUM ('Pending', 'Ready to send', 'Sent', 'Cancelled');

-- Needs to drop the default constraint to allow the ALTER column rollback.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status DROP DEFAULT;

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status TYPE sims.disbursement_schedule_status_rollback USING (
        CASE
            disbursement_schedule_status :: text
            WHEN 'Rejected' THEN 'Cancelled'
            ELSE disbursement_schedule_status :: text
        END
    ) :: sims.disbursement_schedule_status_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.disbursement_schedule_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.disbursement_schedule_status_rollback RENAME TO disbursement_schedule_status;

-- Add the previously removed default constraint.
ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    disbursement_schedule_status
SET
    DEFAULT 'Pending';