-- Drop total_entitled_grant_amount.
ALTER TABLE
    sims.disbursement_receipts DROP COLUMN IF EXISTS total_entitled_grant_amount;

-- Drop total_disbursed_grant_amount.
ALTER TABLE
    sims.disbursement_receipts DROP COLUMN IF EXISTS total_disbursed_grant_amount;

-- Drop total_disbursed_grant_amount_student.
ALTER TABLE
    sims.disbursement_receipts DROP COLUMN IF EXISTS total_disbursed_grant_amount_student;

-- Drop total_disbursed_grant_amount_institution.
ALTER TABLE
    sims.disbursement_receipts DROP COLUMN IF EXISTS total_disbursed_grant_amount_institution;