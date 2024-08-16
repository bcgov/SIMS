ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    total_entitled_disbursed_amount type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    total_disbursed_amount type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    disburse_amount_student type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    disburse_amount_institution type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    total_entitled_grant_amount type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    total_disbursed_grant_amount type numeric(7, 2);

ALTER TABLE
    sims.disbursement_receipts
alter COLUMN
    total_disbursed_grant_amount_student type numeric(7, 2);