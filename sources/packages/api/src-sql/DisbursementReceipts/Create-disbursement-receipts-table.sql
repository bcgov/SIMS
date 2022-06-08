--Create table sims.disbursement_receipts.
CREATE TABLE IF NOT EXISTS sims.disbursement_receipts(
    id SERIAL PRIMARY KEY,
    batch_run_date DATE NOT NULL,
    student_sin CHAR(9) NOT NULL,
    disbursement_schedule_id INT NOT NULL REFERENCES sims.disbursement_schedules(id),
    funding_type CHAR(2) NOT NULL,
    total_entitled_disbursed_amount NUMERIC(7, 2) NOT NULL,
    total_disbursed_amount NUMERIC(7, 2) NOT NULL,
    disburse_date DATE NOT NULL,
    disburse_amount_student NUMERIC(7, 2) NOT NULL,
    disburse_amount_institution NUMERIC(7, 2) NOT NULL,
    date_signed_institution DATE NOT NULL,
    institution_code CHAR(4) NOT NULL,
    disburse_method_student CHAR(1) NOT NULL,
    study_period_end_date DATE NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        CONSTRAINT disbursement_schedule_id_funding_type_unique UNIQUE (disbursement_schedule_id, funding_type)
);

-- ## Comments
COMMENT ON TABLE sims.disbursement_receipts IS 'Disbursement receipts for the disbursements sent.';

COMMENT ON COLUMN sims.disbursement_receipts.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_receipts.batch_run_date IS 'Effective date of data on the disbursement receipt file';

COMMENT ON COLUMN sims.disbursement_receipts.disbursement_schedule_id IS 'Disbursement id to which the document number from the file belongs to.';

COMMENT ON COLUMN sims.disbursement_receipts.student_sin IS 'SIN number of the student who received the disbursement.';

COMMENT ON COLUMN sims.disbursement_receipts.funding_type IS 'Indicates the funding type of the disbursement receipt item. Values can have FE(Federal) or BC(Provincial).';

COMMENT ON COLUMN sims.disbursement_receipts.total_entitled_disbursed_amount IS 'Total entitled disbursed amount for either FE(Federal) or BC(Provincial).';

COMMENT ON COLUMN sims.disbursement_receipts.total_disbursed_amount IS 'Total disbursed amount for either FE(Federal) or BC(Provincial).';

COMMENT ON COLUMN sims.disbursement_receipts.disburse_date IS 'Financial posting date of NSLSC.';

COMMENT ON COLUMN sims.disbursement_receipts.disburse_amount_student IS 'Amount disbursed to the student.';

COMMENT ON COLUMN sims.disbursement_receipts.disburse_amount_institution IS 'Amount disbursed to the institution.';

COMMENT ON COLUMN sims.disbursement_receipts.date_signed_institution IS 'The date signed by the institution of the student at the time they receive the loan certificate.';

COMMENT ON COLUMN sims.disbursement_receipts.institution_code IS 'Institution code.';

COMMENT ON COLUMN sims.disbursement_receipts.disburse_method_student IS 'Method of disbursement to student. C(By cheqe),E(By EFT), <space> disbursement only to institution.';

COMMENT ON COLUMN sims.disbursement_receipts.study_period_end_date IS 'Study period end date.';

COMMENT ON COLUMN sims.disbursement_receipts.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.disbursement_receipts.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.disbursement_receipts.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.disbursement_receipts.modifier IS 'Modifier of the record.';