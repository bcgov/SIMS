CREATE TABLE IF NOT EXISTS sims.student_appeals (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES sims.applications (id) ON DELETE CASCADE,
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