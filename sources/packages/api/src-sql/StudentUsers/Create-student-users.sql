CREATE TABLE IF NOT EXISTS sims.student_users(
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES sims.users(id),
  student_id INT NOT NULL REFERENCES sims.students(id),
  student_account_application_id INT REFERENCES sims.student_account_applications(id),
  -- Audit columns
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.student_users IS 'sims.student_users and users relationships, current and past ones. One of these records will be related directly to the student defining the active one.';

COMMENT ON COLUMN sims.student_users.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_users.user_id IS 'User related to the student.';

COMMENT ON COLUMN sims.student_users.student_id IS 'Student related to the user.';

COMMENT ON COLUMN sims.student_users.student_account_application_id IS 'Optional student account application in case of this relationship was created after a student account application assessed by the Ministry.';

COMMENT ON COLUMN sims.student_users.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_users.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_users.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.student_users.modifier IS 'Modifier of the record. Null specified the record is modified by system.';