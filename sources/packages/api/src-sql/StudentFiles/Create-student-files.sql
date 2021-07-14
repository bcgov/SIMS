CREATE TABLE IF NOT EXISTS student_files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(500) NOT NULL,
  unique_file_name VARCHAR(500) NOT NULL,
  group_name VARCHAR(500),
  mime_type VARCHAR(250) NOT NULL,
  file_content BYTEA NOT NULL,
  
  -- Reference Columns
  student_id INT REFERENCES students(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE student_files IS 'The main resource table to store files related to an aplication or student';
COMMENT ON COLUMN student_files.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN student_files.file_name IS 'Friendly file name to be displayed to the user.';
COMMENT ON COLUMN student_files.unique_file_name IS 'Unique file name to be used to reference the file.';
COMMENT ON COLUMN student_files.group_name IS 'Allow to group the files that belongs to a certain context.';
COMMENT ON COLUMN student_files.mime_type IS 'File MIME type.';
COMMENT ON COLUMN student_files.file_content IS 'Foreign key reference to the applications table.';
COMMENT ON COLUMN student_files.student_id IS 'Foreign key reference to the students table.';
COMMENT ON COLUMN student_files.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN student_files.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN student_files.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN student_files.modifier IS 'Modifier of the record. Null specified the record is modified by system';