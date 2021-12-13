CREATE TABLE IF NOT EXISTS sims.institution_notes (
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES sims.institutions(id),
    note_id INT NOT NULL REFERENCES sims.notes(id)
);

-- Comments for table and column
COMMENT ON TABLE sims.institution_notes IS 'Table that holds many to many mapping for institution notes.';

COMMENT ON COLUMN sims.institution_notes.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.institution_notes.institution_id IS 'Reference to institution id in institutions table.';

COMMENT ON COLUMN sims.institution_notes.note_id IS 'Reference to note id in notes table.';