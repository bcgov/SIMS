CREATE TABLE IF NOT EXISTS students(
  id SERIAL PRIMARY KEY,
  contact_info JSONB NOT NULL,
  sin VARCHAR(10) NOT NULL,

  -- Reference Columns
  user_id INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE students IS 'The main resource table to store student related information. This table consists of mandatory contact information and social insurance number of student';
COMMENT ON COLUMN students.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN students.contact_info IS 'A JSONB structure to store contact information. Possible json structure will consists address object containing [address line1, address line2, country, province, postal code] and international phone number field';
COMMENT ON COLUMN students.sin IS 'Social insurance number of student';
COMMENT ON COLUMN students.user_id IS 'Foreign key reference to users table which includes users related information of student';
COMMENT ON COLUMN students.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN students.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN students.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN students.modifier IS 'Modifier of the record. Null specified the record is modified by system';
