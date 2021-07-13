CREATE TABLE IF NOT EXISTS application_files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  unique_file_name VARCHAR(500) NOT NULL,
  group_name VARCHAR(500) NOT NULL,
  file_content BYTEA NOT NULL,
  
  -- Reference Columns
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE application_files IS 'The main resource table to store files related to an aplication or student';
COMMENT ON COLUMN application_files.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN application_files.file_name IS 'Friendly file name to be displayed to the user.';
COMMENT ON COLUMN application_files.unique_file_name IS 'Unique file name to be used to reference the file.';
COMMENT ON COLUMN application_files.file_content IS 'Foreign key reference to the applications table.';
COMMENT ON COLUMN application_files.application_id IS 'Foreign key reference to the applications table.';
COMMENT ON COLUMN application_files.student_id IS 'Foreign key reference to the students table.';
COMMENT ON COLUMN application_files.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN application_files.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN application_files.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN application_files.modifier IS 'Modifier of the record. Null specified the record is modified by system';