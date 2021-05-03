-- Create Institution Location table
CREATE TABLE IF NOT EXISTS institution_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  info JSONB NOT NULL,
  institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- Comments
COMMENT ON TABLE institution_locations IS 'The table store institution location information';
COMMENT ON COLUMN institution_locations.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN institution_locations.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN institution_locations.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN institution_locations.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN institution_locations.modifier IS 'Modifier of the record. Null specified the record is modified by system';
COMMENT ON COLUMN institution_locations.info IS 'JSONB field to store any information about institution location';
COMMENT ON COLUMN institution_locations.institution_id IS 'Foreign key reference to institutions table';
