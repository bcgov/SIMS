ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    COLUMN ecert_feedback_error_id INT REFERENCES sims.ecert_feedback_errors(id);

COMMENT ON COLUMN sims.disbursement_feedback_errors.ecert_feedback_error_id IS 'E-Cert feedback error id of the error received.';

-- Populate ecert_feedback_error_id based on existing column error_code.
UPDATE
    sims.disbursement_feedback_errors
SET
    ecert_feedback_error_id = ecert_feedback_error.id
FROM
    sims.ecert_feedback_errors ecert_feedback_error
WHERE
    ecert_feedback_error.error_code = sims.disbursement_feedback_errors.error_code
    AND ecert_feedback_error.offering_intensity = (
        SELECT
            offering.offering_intensity
        FROM
            sims.disbursement_schedules disbursement_schedule
            INNER JOIN sims.student_assessments student_assessment ON disbursement_schedule.student_assessment_id = student_assessment.id
            INNER JOIN sims.education_programs_offerings offering ON student_assessment.offering_id = offering.id
        WHERE
            disbursement_schedule.id = sims.disbursement_feedback_errors.disbursement_schedule_id
    );

-- Once the ecert_feedback_error_id is populated set the column to be NOT NULL.
ALTER TABLE
    sims.disbursement_feedback_errors
ALTER COLUMN
    ecert_feedback_error_id
SET
    NOT NULL;