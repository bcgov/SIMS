CREATE TABLE IF NOT EXISTS sims.student_account_applications(
  id SERIAL PRIMARY KEY,
  submitted_data JSONB NOT NULL,
  user_id INT NOT NULL REFERENCES sims.users(id),
  submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
  assessed_by INT REFERENCES sims.users(id),
  assessed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.student_account_applications IS 'Student account information to have the data validated. Upon a successful validation, a new student can be created or the user can be associated with an existing one.';

COMMENT ON COLUMN sims.student_account_applications.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_account_applications.submitted_data IS 'Student information to be validated.';

COMMENT ON COLUMN sims.student_account_applications.user_id IS 'User that is requesting the data validation to become a student.';

COMMENT ON COLUMN sims.student_account_applications.submitted_date IS 'Date that the student account application was submitted by the student.';

COMMENT ON COLUMN sims.student_account_applications.assessed_by IS 'Ministry user that approved the student account application.';

COMMENT ON COLUMN sims.student_account_applications.assessed_date IS 'Date that the Ministry user approved the student account application.';

COMMENT ON COLUMN sims.student_account_applications.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_account_applications.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_account_applications.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.student_account_applications.modifier IS 'Modifier of the record. Null specified the record is modified by system.';