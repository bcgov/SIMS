ALTER TABLE
    sims.form_submissions
ADD
    COLUMN submission_status_updated_by INT REFERENCES sims.users(id),
ADD
    COLUMN submission_status_updated_on TIMESTAMP WITH TIME ZONE;

-- Update the submission_status audit columns for existing form submissions that are pending.
UPDATE
    sims.form_submissions
SET
    submission_status_updated_by = creator,
    submission_status_updated_on = created_at
WHERE
    submission_status = 'Pending';

-- Update the submission_status audit columns for existing form submissions that are completed with final status.
UPDATE
    sims.form_submissions
SET
    submission_status_updated_by = assessed_by,
    submission_status_updated_on = assessed_date
WHERE
    submission_status IN ('Completed', 'Declined');

-- Add NOT NULL constraint to the submission_status audit columns.
ALTER TABLE
    sims.form_submissions
ALTER COLUMN
    submission_status_updated_by
SET
    NOT NULL,
ALTER COLUMN
    submission_status_updated_on
SET
    NOT NULL;

COMMENT ON COLUMN sims.form_submissions.submission_status_updated_by IS 'User who updated the submission status.';

COMMENT ON COLUMN sims.form_submissions.submission_status_updated_on IS 'Date and time when the submission status was updated.';