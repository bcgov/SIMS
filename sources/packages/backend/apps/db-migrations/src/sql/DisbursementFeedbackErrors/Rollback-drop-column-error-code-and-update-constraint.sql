-- Add column without NOT NULL constraint.
ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    COLUMN error_code VARCHAR(10);

COMMENT ON COLUMN sims.disbursement_feedback_errors.error_code IS 'Errors code received from feedback file for the disbursement sent to ESDC.';

-- Populate error_code based on existing column ecert_feedback_error_id.
UPDATE
    sims.disbursement_feedback_errors
SET
    error_code = ecert_feedback_error.error_code
FROM
    sims.ecert_feedback_errors ecert_feedback_error
WHERE
    ecert_feedback_error.id = sims.disbursement_feedback_errors.ecert_feedback_error_id;

-- Once the error_code is populated set the column to be NOT NULL.
ALTER TABLE
    sims.disbursement_feedback_errors
ALTER COLUMN
    error_code
SET
    NOT NULL;

-- Add the unique constraint based on error_code back. 
ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    CONSTRAINT disbursement_schedule_id_error_code_unique UNIQUE (disbursement_schedule_id, error_code);

COMMENT ON CONSTRAINT disbursement_schedule_id_error_code_unique ON sims.disbursement_feedback_errors IS 'Ensure that error code is unique within a disbursement schedule.';

-- Drop the new constraint.
ALTER TABLE
    sims.disbursement_feedback_errors DROP CONSTRAINT disbursement_schedule_id_ecert_feedback_error_id_unique;