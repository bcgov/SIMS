-- Create Table
CREATE TABLE IF NOT EXISTS institution_type(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE institution_type IS 'The look up table for institution types';

COMMENT ON COLUMN institution_type.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN institution_type.name IS 'Name which describes the institution type';

COMMENT ON COLUMN institution_type.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN institution_type.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN institution_type.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN institution_type.modifier IS 'Modifier of the record. Null specified the record is modified by system';
