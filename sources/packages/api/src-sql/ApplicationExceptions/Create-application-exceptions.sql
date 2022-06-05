CREATE TABLE IF NOT EXISTS sims.application_exceptions (
    id SERIAL PRIMARY KEY,
    exception_status sims.application_exception_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        note_id INT REFERENCES sims.notes (id) ON DELETE
    SET
        NULL,
        -- Audit columns
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
        creator INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.application_exceptions IS 'Represents a set of exceptions detected on a submitted full-time/part-time student application, for instance, when a document need to be reviewed.';

COMMENT ON COLUMN sims.application_exceptions.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.application_exceptions.exception_status IS 'Current approval status of exceptions (e.g. Pending, Approved, Denied).';

COMMENT ON COLUMN sims.application_exceptions.assessed_date IS 'Date that the Ministry approved or denied the exceptions.';

COMMENT ON COLUMN sims.application_exceptions.assessed_by IS 'Ministry user that approved or denied the exceptions.';

COMMENT ON COLUMN sims.application_exceptions.note_id IS 'Note added by the Ministry while approving or denying the exceptions.';

COMMENT ON COLUMN sims.application_exceptions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.application_exceptions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.application_exceptions.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.application_exceptions.modifier IS 'Modifier of the record. Null specified the record is modified by system.';