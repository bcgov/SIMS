CREATE TABLE sims.form_submission_items(
    id SERIAL PRIMARY KEY,
    form_submission_id INT REFERENCES sims.form_submissions(id) NOT NULL,   
    dynamic_form_configuration_id INT REFERENCES sims.dynamic_form_configurations(id) NOT NULL,
    submitted_data jsonb NOT NULL,   
    submission_status sims.form_submission_status NOT NULL,
    decision_date TIMESTAMP WITH TIME ZONE,
    decision_by INT REFERENCES sims.users (id),
    decision_note_id INT REFERENCES sims.notes (id),
    -- Audit columns.
    -- Creator and modifier are not provided as the configurations cannot be created or updated by application users.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
