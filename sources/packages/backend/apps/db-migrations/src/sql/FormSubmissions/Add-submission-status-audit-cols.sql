ALTER TABLE
    sims.form_submissions
ADD
    COLUMN submission_status_updated_by INT REFERENCES sims.users(id),
ADD
    COLUMN submission_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.form_submissions.submission_status_updated_by IS 'User who updated the submission status.';

COMMENT ON COLUMN sims.form_submissions.submission_status_updated_on IS 'Date and time when the submission status was updated.';