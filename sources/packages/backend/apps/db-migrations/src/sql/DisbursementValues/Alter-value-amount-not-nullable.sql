-- Disbursement values must have a value amount to be valid.
-- This migration makes the value_amount column non-nullable.
-- Business processes should ensure that a valid amount is always provided when creating disbursement values.
ALTER TABLE
    sims.disbursement_values
ALTER COLUMN
    value_amount
SET
    NOT NULL;