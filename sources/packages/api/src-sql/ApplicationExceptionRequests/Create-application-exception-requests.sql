CREATE TABLE IF NOT EXISTS sims.application_exception_requests (
    id SERIAL PRIMARY KEY,
    application_exception_id INT NOT NULL REFERENCES sims.application_exceptions(id) ON DELETE CASCADE,
    exception_name VARCHAR(100) NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        UNIQUE (application_exception_id, exception_name)
);

-- ## Comments
COMMENT ON TABLE sims.application_exception_requests IS 'Represents the list of exceptions detected on a submitted full-time/part-time student application, for instance, when a document needs to be reviewed.';

COMMENT ON COLUMN sims.application_exception_requests.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.application_exception_requests.application_exception_id IS 'Master record that group all exceptions detected on a submitted student application.';

COMMENT ON COLUMN sims.application_exception_requests.exception_name IS 'Unique identifier name of an application exception.';

COMMENT ON COLUMN sims.application_exception_requests.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.application_exception_requests.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.application_exception_requests.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.application_exception_requests.modifier IS 'Modifier of the record.';