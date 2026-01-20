CREATE TABLE sims.form_submissions(
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES sims.students(id) NOT NULL,
    application_id INT REFERENCES sims.applications(id),
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_grouping_type sims.form_submission_grouping_types NOT NULL,
    submission_status sims.form_submission_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id),
    assessed_student_note_id INT REFERENCES sims.notes (id),
    CONSTRAINT form_submissions_application_id_constraint CHECK (
        (
            submission_grouping_type IN (
                'Application bundle' :: sims.form_submission_grouping_types,
                'Application standalone' :: sims.form_submission_grouping_types
            )
            AND application_id IS NOT NULL
        )
        OR (
            submission_grouping_type NOT IN (
                'Application bundle' :: sims.form_submission_grouping_types,
                'Application standalone' :: sims.form_submission_grouping_types
            )
        )
    ),
    -- Audit columns.
    -- Creator and modifier are not provided as the configurations cannot be created or updated by application users.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);