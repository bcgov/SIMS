ALTER TABLE
    sims.form_submissions
ADD
    COLUMN cancellation_reason sims.form_submission_cancellation_reasons;

COMMENT ON COLUMN sims.form_submissions.cancellation_reason IS 'Reason for cancellation of the form submission.';

-- For all the existing cancelled form submissions student cancelled submission is the only possible reason.
UPDATE
    sims.form_submissions
SET
    cancellation_reason = 'Student cancelled submission'
WHERE
    submission_status = 'Cancelled';

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