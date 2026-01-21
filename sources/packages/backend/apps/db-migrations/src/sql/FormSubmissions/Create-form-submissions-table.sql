CREATE TABLE sims.form_submissions(
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES sims.students(id) NOT NULL,
    application_id INT REFERENCES sims.applications(id),
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_grouping_type sims.form_submission_grouping_types NOT NULL,
    submission_status sims.form_submission_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id),
    assessed_note_id INT REFERENCES sims.notes (id),
    -- Audit columns.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id) NOT NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
    -- Ensure application related submissions have an application ID.
    CONSTRAINT form_submissions_application_id_constraint CHECK (
        (
            submission_grouping_type = 'Application bundle' :: sims.form_submission_grouping_types,
            AND application_id IS NOT NULL
        )
        OR (
            submission_grouping_type != 'Application bundle' :: sims.form_submission_grouping_types
        )
    ),
    -- Ensure assessed fields are all provided when submission status is not pending.
    CONSTRAINT form_submissions_assessed_fields_required_constraint CHECK (
        (
            submission_status != 'Pending' :: sims.form_submission_status
            AND assessed_date IS NOT NULL
            AND assessed_by IS NOT NULL
            AND assessed_note_id IS NOT NULL
        )
        OR (
            submission_status = 'Pending' :: sims.form_submission_status
        )
    )
);