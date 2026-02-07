CREATE TABLE sims.form_submissions(
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES sims.students(id) NOT NULL,
    application_id INT REFERENCES sims.applications(id),
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
    form_category sims.form_category_types NOT NULL,
    submission_status sims.form_submission_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id),
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id) NOT NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
    -- Ensure assessed fields are all provided when submission status is not pending.
    CONSTRAINT form_submissions_assessed_fields_required_constraint CHECK (
        (
            submission_status != 'Pending' :: sims.form_submission_status
            AND assessed_date IS NOT NULL
            AND assessed_by IS NOT NULL
        )
        OR (
            submission_status = 'Pending' :: sims.form_submission_status
        )
    )
);

-- Table and columns comments.
COMMENT ON TABLE sims.form_submissions IS 'Form submissions for Ministry evaluation and decision. Each submission can contain one or more forms where each form is assessed individually.';

COMMENT ON COLUMN sims.form_submissions.id IS 'Primary key of the form submission.';

COMMENT ON COLUMN sims.form_submissions.student_id IS 'Student associated with the form submission.';

COMMENT ON COLUMN sims.form_submissions.application_id IS 'Application associated with the submission when the form is student application-related.';

COMMENT ON COLUMN sims.form_submissions.submitted_date IS 'Date and time when the submission was received.';

COMMENT ON COLUMN sims.form_submissions.form_category IS 'Category of the form. All forms for the submission must share the same category. This column is denormalized from the form items for easier querying.';

COMMENT ON COLUMN sims.form_submissions.submission_status IS 'Current status of the submission. A submission will be considered completed when all individual form items have been assessed and are no longer in pending state.';

COMMENT ON COLUMN sims.form_submissions.assessed_date IS 'Date and time when the submission was assessed. When assessed, the status must be either Completed or Declined.';

COMMENT ON COLUMN sims.form_submissions.assessed_by IS 'User who assessed the submission.';

COMMENT ON COLUMN sims.form_submissions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.form_submissions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.form_submissions.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.form_submissions.modifier IS 'Modifier of the record.';

-- Constraints comments.
COMMENT ON CONSTRAINT form_submissions_assessed_fields_required_constraint ON sims.form_submissions IS 'Requires assessed_date, and assessed_by when submission_status is not pending.';