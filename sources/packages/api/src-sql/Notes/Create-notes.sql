CREATE TABLE IF NOT EXISTS sims.notes (
    id SERIAL PRIMARY KEY,
    note_type sims.note_types NOT NULL,
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
COMMENT ON TABLE sims.notes IS 'Table that holds note details that are entered for both student and institution.';

COMMENT ON COLUMN sims.notes.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.notes.note_type IS 'Note type enumeration.Consists of note type for student and institution.';

COMMENT ON COLUMN sims.notes.description IS 'Description of a note';

COMMENT ON COLUMN sims.notes.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.notes.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.notes.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.notes.modifier IS 'Modifier of the record. Null specified the record is modified by system';