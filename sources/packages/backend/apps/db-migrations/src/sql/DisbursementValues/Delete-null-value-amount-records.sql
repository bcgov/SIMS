-- Remove records from disbursement_values where value_amount is NULL.
-- This is to clean up any records that may have been created with NULL amounts as they are not valid.
-- This column is becoming non-nullable in a future migration and will not have a rollback in place.
DELETE FROM
    sims.disbursement_values
WHERE
    value_amount IS NULL;