CREATE TABLE IF NOT EXISTS sequence_controls (
  id SERIAL PRIMARY KEY,
  sequence_name VARCHAR(100) NOT NULL UNIQUE,
  sequence_number INT NOT NULL,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE sequence_controls IS 'Generic table to control sequence numbers that are outside the control of this solution.';
COMMENT ON COLUMN sequence_controls.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN sequence_controls.sequence_name IS 'Name of the sequence.';
COMMENT ON COLUMN sequence_controls.sequence_number IS 'Current value.';
COMMENT ON COLUMN sequence_controls.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN sequence_controls.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN sequence_controls.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN sequence_controls.modifier IS 'Modifier of the record. Null specified the record is modified by system';