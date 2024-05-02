ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    COLUMN ecert_feedback_error_id INT REFERENCES sims.ecert_feedback_errors(id);

COMMENT ON COLUMN sims.disbursement_feedback_errors.ecert_feedback_error_id IS 'E-Cert feedback error id of the error received.';

-- Populate ecert_feedback_error_id based on existing column error_code.
UPDATE
    sims.disbursement_feedback_errors
SET
    ecert_feedback_error_id = errors.id
FROM
    sims.ecert_feedback_errors errors
WHERE
    errors.error_code = sims.disbursement_feedback_errors.error_code
    AND errors.offering_intensity = (
        SELECT
            epo.offering_intensity
        FROM
            sims.disbursement_schedules ds
            INNER JOIN sims.student_assessments sa ON ds.student_assessment_id = sa.id
            INNER JOIN sims.education_programs_offerings epo ON sa.offering_id = epo.id
        WHERE
            ds.id = sims.disbursement_feedback_errors.disbursement_schedule_id
    );

-- Once the ecert_feedback_error_id is populated set the column to be NOT NULL.
ALTER TABLE
    sims.disbursement_feedback_errors
ALTER COLUMN
    ecert_feedback_error_id
SET
    NOT NULL;