-- Add tuition_remittance_requested_amount.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS tuition_remittance_requested_amount INT NULL;

COMMENT ON COLUMN sims.education_programs_offerings.tuition_remittance_requested_amount IS 'Tuition remittance amount requested.';

-- Add tuition_remittance_requested.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS tuition_remittance_requested VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs_offerings.tuition_remittance_requested IS 'Tuition remittance requested like yes, no.';