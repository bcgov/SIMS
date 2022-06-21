-- Add column total_entitled_grant_amount to sims.disbursement_receipts.
ALTER TABLE
    sims.disbursement_receipts
ADD
    COLUMN IF NOT EXISTS total_entitled_grant_amount NUMERIC(7, 2) NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_grant_amount IS 'Total Federal or BC grant entitled amount.';

-- Add column total_disbursed_grant_amount to sims.disbursement_receipts.
ALTER TABLE
    sims.disbursement_receipts
ADD
    COLUMN IF NOT EXISTS total_disbursed_grant_amount NUMERIC(7, 2) NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_disbursed_grant_amount IS 'Total Federal or BC grant disbursed amount.';

-- Add column total_disbursed_grant_amount_student to sims.disbursement_receipts.
ALTER TABLE
    sims.disbursement_receipts
ADD
    COLUMN IF NOT EXISTS total_disbursed_grant_amount_student NUMERIC(7, 2) NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_disbursed_grant_amount_student IS 'Total Federal or BC grant disbursed amount to student.';

-- Add column total_disbursed_grant_amount_institution to sims.disbursement_receipts.
ALTER TABLE
    sims.disbursement_receipts
ADD
    COLUMN IF NOT EXISTS total_disbursed_grant_amount_institution NUMERIC(7, 2) NOT NULL;

COMMENT ON COLUMN sims.disbursement_receipts.total_disbursed_grant_amount_institution IS 'Total Federal or BC grant disbursed amount to institution.';