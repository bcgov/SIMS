CREATE TABLE IF NOT EXISTS application_student_files (
  id SERIAL PRIMARY KEY,
 
  -- Reference Columns
  application_id INT REFERENCES applications(id) ON DELETE CASCADE,
  student_file_id INT REFERENCES student_files(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE application_student_files IS 'Creates a relationship between an applicaion and the related student files.';
COMMENT ON COLUMN application_student_files.id IS 'Auto-generated sequential primary key column.';
COMMENT ON COLUMN application_student_files.application_id IS 'Foreign key reference to the applications table.';
COMMENT ON COLUMN application_student_files.student_file_id IS 'Foreign key reference to the table that keeps the students files.';
COMMENT ON COLUMN application_student_files.created_at IS 'Record creation timestamp.';
COMMENT ON COLUMN application_student_files.updated_at IS 'Record update timestamp.';
COMMENT ON COLUMN application_student_files.creator IS 'Creator of the record. Null specified the record is created by system.';
COMMENT ON COLUMN application_student_files.modifier IS 'Modifier of the record. Null specified the record is modified by system.';