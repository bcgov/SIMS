CREATE TABLE IF NOT EXISTS sims.student_appeal_requests (
    id SERIAL PRIMARY KEY,
    student_appeal_id INT NOT NULL REFERENCES sims.student_appeals(id) ON DELETE CASCADE,
    submitted_data jsonb NOT NULL,
    submitted_form_name VARCHAR (100) NOT NULL,
    appeal_status sims.student_appeal_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        note_id INT REFERENCES sims.notes (id) ON DELETE
    SET
        NULL,
        -- Audit columns
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW (),
        creator INT NULL DEFAULT NULL REFERENCES users (id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users (id) ON DELETE
    SET
        NULL
);