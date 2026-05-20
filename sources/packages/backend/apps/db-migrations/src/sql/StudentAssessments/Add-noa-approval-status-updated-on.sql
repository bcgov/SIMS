ALTER TABLE
    sims.student_assessments
ADD
    COLUMN noa_approval_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.student_assessments.noa_approval_status_updated_on IS 'Date and time when the noa_approval_status column was updated.';

-- TODO Add migration if required
-- UPDATE
--     sims.student_assessments sa
-- SET
--     noa_approval_status_updated_on = NOW()
-- WHERE
--     noa_approval_status = 'Required';