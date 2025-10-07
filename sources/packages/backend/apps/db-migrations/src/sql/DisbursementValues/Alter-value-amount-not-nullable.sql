-- Remove records from disbursement_values where value_amount is NULL.
-- This is to clean up any records that may have been created with NULL amounts as they are not valid.
-- No rollback is provided for this deletion as it is a one-time cleanup operation.
DELETE FROM
    sims.disbursement_values
WHERE
    value_amount IS NULL;

-- Disbursement values must have a value amount to be valid.
-- This migration makes the value_amount column non-nullable.
-- Business processes should ensure that a valid amount is always provided when creating disbursement values.
ALTER TABLE
    sims.disbursement_values
ALTER COLUMN
    value_amount
SET
    NOT NULL;