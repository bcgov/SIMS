ALTER TABLE
    sims.form_submissions
ADD
    COLUMN cancellation_reason sims.form_submission_cancellation_reasons,
    -- This column is purely added for the purpose of copying the submission_status values
    -- before updating the submission_status of form submissions which belong to 
    -- edited and cancelled applications to 'Cancelled' so that rollback can be achieved in a safe manner.
ADD
    COLUMN submission_status_before_update sims.form_submission_status;

COMMENT ON COLUMN sims.form_submissions.cancellation_reason IS 'Reason for cancellation of the form submission.';

COMMENT ON COLUMN sims.form_submissions.submission_status_before_update IS 'Submission status of the updated form submission before it was updated.';

-- Update the submission_status as 'Cancelled' with cancellation reason for all the form submissions which belong to cancelled applications.
-- While executing this update, we are also storing the previous submission_status in submission_status_before_update column so that rollback can be achieved in a safe manner.
UPDATE
    sims.form_submissions
SET
    submission_status_before_update = submission_status,
    submission_status = 'Cancelled',
    cancellation_reason = 'Application cancelled',
    submission_status_updated_by = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    submission_status_updated_on = NOW()
FROM
    sims.applications applications
WHERE
    form_submissions.application_id = applications.id
    AND applications.application_status = 'Cancelled'
    AND form_submissions.submission_status != 'Cancelled';

-- Update the submission_status as 'Cancelled' with cancellation reason for all the form submissions which belong to edited applications.
-- While executing this update, we are also storing the previous submission_status in submission_status_before_update column so that rollback can be achieved in a safe manner.
UPDATE
    sims.form_submissions
SET
    submission_status_before_update = submission_status,
    submission_status = 'Cancelled',
    cancellation_reason = 'Application edited',
    submission_status_updated_by = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    submission_status_updated_on = NOW()
FROM
    sims.applications applications
WHERE
    form_submissions.application_id = applications.id
    AND applications.application_status = 'Edited'
    AND applications.application_edit_status IN ('Original', 'Edited')
    AND form_submissions.submission_status != 'Cancelled'
    AND NOT EXISTS (
        SELECT
            1
        FROM
            sims.applications change_request_applications
        WHERE
            change_request_applications.preceding_application_id = applications.id
            AND change_request_applications.application_edit_status = 'Changed with approval'
    );

-- For all the remaining cancelled form submissions without a cancellation reason, set it as 'Student cancelled submission'.
UPDATE
    sims.form_submissions
SET
    cancellation_reason = 'Student cancelled submission'
WHERE
    submission_status = 'Cancelled'
    AND cancellation_reason IS NULL;

-- Add a constraint to ensure that cancellation reason is populated when submission status is cancelled.
ALTER TABLE
    sims.form_submissions
ADD
    CONSTRAINT cancellation_reason_required_constraint CHECK (
        (
            submission_status = 'Cancelled'
            AND cancellation_reason IS NOT NULL
        )
        OR submission_status != 'Cancelled'
    );