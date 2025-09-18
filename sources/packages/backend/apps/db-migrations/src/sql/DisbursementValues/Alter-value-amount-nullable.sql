-- Make the value_amount column nullable in the disbursement_values table.
-- This is to allow for a rollback of the migration that made it non-nullable.
ALTER TABLE
    sims.disbursement_values
ALTER COLUMN
    value_amount DROP NOT NULL;