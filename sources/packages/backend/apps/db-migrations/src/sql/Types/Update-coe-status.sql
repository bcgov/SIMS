--Removing the value Not Required from sims.coe_status.
--As postgres does not support removal of an Enum Value, We create a temporary enum and rename it.
CREATE TYPE sims.coe_status_to_rollback AS ENUM ('Required', 'Completed', 'Declined');

ALTER TABLE
    sims.disbursement_schedules
ALTER COLUMN
    coe_status DROP DEFAULT,
ALTER COLUMN
    coe_status TYPE sims.coe_status_to_rollback USING coe_status :: text :: sims.coe_status_to_rollback,
ALTER COLUMN
    coe_status
SET
    DEFAULT 'Required';

DROP TYPE sims.coe_status;

ALTER TYPE sims.coe_status_to_rollback RENAME TO coe_status;