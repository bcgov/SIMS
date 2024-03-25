CREATE TABLE sims.student_loan_balances(
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES sims.students(id),
  csl_balance NUMERIC(8, 2) NOT NULL,
  balance_date TIMESTAMP WITH TIME ZONE,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.student_loan_balances IS 'Student Loan Balances for a student shared by NSLSC monthly.';

COMMENT ON COLUMN sims.student_loan_balances.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN sims.student_loan_balances.student_id IS 'Student Id whose balance is shared by NSLSC.';

COMMENT ON COLUMN sims.student_loan_balances.csl_balance IS 'Student loan balance amount for a student.';

COMMENT ON COLUMN sims.student_loan_balances.balance_date IS 'Student loan balance generated and shared date by NSLSC.';

COMMENT ON COLUMN sims.student_loan_balances.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_loan_balances.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_loan_balances.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.student_loan_balances.modifier IS 'Modifier of the record.';