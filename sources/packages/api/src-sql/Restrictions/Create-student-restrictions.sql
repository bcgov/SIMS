-- Create Table sims.student_restrictions
CREATE TABLE IF NOT EXISTS sims.student_restrictions(
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES sims.students(id),
  application_id INT REFERENCES sims.applications(id),
  restriction_id INT NOT NULL REFERENCES sims.restrictions(id), 
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);
-- Comments for table and column

COMMENT ON TABLE sims.student_restrictions IS 'Table that has restriction details for student user';

COMMENT ON COLUMN sims.student_restrictions.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.student_restrictions.student_id IS 'Foreign key reference to student table';

COMMENT ON COLUMN sims.student_restrictions.application_id IS 'Foreign key reference to application table';

COMMENT ON COLUMN sims.student_restrictions.restriction_id IS 'Foreign key reference to restrictions table';

COMMENT ON COLUMN sims.student_restrictions.is_active IS 'Value which decides if a student restriction is active or not';

COMMENT ON COLUMN sims.student_restrictions.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.student_restrictions.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.student_restrictions.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.student_restrictions.modifier IS 'Modifier of the record. Null specified the record is modified by system';
