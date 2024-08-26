ALTER TABLE
    sims.disbursement_receipts
ALTER COLUMN
    total_entitled_disbursed_amount TYPE NUMERIC(8, 2),
ALTER COLUMN
    total_disbursed_amount TYPE NUMERIC(8, 2),
ALTER COLUMN
    disburse_amount_student TYPE NUMERIC(8, 2),
ALTER COLUMN
    disburse_amount_institution TYPE NUMERIC(8, 2),
ALTER COLUMN
    total_entitled_grant_amount TYPE NUMERIC(8, 2),
ALTER COLUMN
    total_disbursed_grant_amount TYPE NUMERIC(8, 2),
ALTER COLUMN
    total_disbursed_grant_amount_student TYPE NUMERIC(8, 2),
ALTER COLUMN
    total_disbursed_grant_amount_institution TYPE NUMERIC(8, 2);