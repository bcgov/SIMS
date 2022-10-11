CREATE TABLE IF NOT EXISTS sims.messages (
    id INTEGER PRIMARY KEY,
    description VARCHAR(1000) NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL
);

-- Comments for table and column
COMMENT ON TABLE sims.messages IS 'Table to store messages.';

COMMENT ON COLUMN sims.messages.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.notes.description IS 'Description of a message.';

COMMENT ON COLUMN sims.notes.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.notes.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.notes.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.notes.modifier IS 'Modifier of the record. Null specified the record is modified by system.';