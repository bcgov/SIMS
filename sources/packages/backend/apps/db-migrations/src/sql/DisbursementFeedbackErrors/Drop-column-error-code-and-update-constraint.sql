-- Drop constraint before dropping the column.
ALTER TABLE
    sims.disbursement_feedback_errors DROP CONSTRAINT disbursement_schedule_id_error_code_unique;

-- Drop column error_code.
ALTER TABLE
    sims.disbursement_feedback_errors DROP COLUMN error_code;

-- Add constraint based on ecert_feedback_error_id.
ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    CONSTRAINT disbursement_schedule_id_ecert_feedback_error_id_unique UNIQUE (
        disbursement_schedule_id,
        ecert_feedback_error_id
    );

COMMENT ON CONSTRAINT disbursement_schedule_id_ecert_feedback_error_id_unique ON sims.disbursement_feedback_errors IS 'Ensure that e-Cert feedback error id is unique within a disbursement schedule.';