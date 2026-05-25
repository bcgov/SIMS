ALTER TABLE
    sims.student_assessments
ADD
    COLUMN noa_approval_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.student_assessments.noa_approval_status_updated_on IS 'Date and time when the noa_approval_status column was updated.';

-- Migrate noa_approval_status_updated_on where noa_approval_status is 'Required' using application_status_updated_on since it is set right before the noa_approval_status is updated to 'Required'.
-- This will allow existing Assessments to get notified according to schedule.
UPDATE
    sims.student_assessments student_assessments
SET
    noa_approval_status_updated_on = applications.application_status_updated_on
FROM
    sims.applications applications
WHERE
    applications.current_assessment_id = student_assessments.id
    AND student_assessments.noa_approval_status = 'Required';