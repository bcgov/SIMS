CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  data jsonb NOT NULL,

  -- Reference Columns
  student_id INT REFERENCES students(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE applications IS 'The main resource table to store student financial assistance applications.';
COMMENT ON COLUMN applications.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN applications.data IS 'Information that represents the entire dynamic data collected in the student application.';
COMMENT ON COLUMN applications.student_id IS 'Foreign key reference to the student table.';
COMMENT ON COLUMN applications.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN applications.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN applications.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN applications.modifier IS 'Modifier of the record. Null specified the record is modified by system';