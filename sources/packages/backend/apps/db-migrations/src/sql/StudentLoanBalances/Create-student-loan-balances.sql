CREATE TABLE sims.student_loan_balances(
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES sims.students(id),
  csl_balance NUMERIC(8, 2) NOT NULL,
  balance_date DATE NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
  -- Constraint
  CONSTRAINT student_balance_date UNIQUE (student_id, balance_date)
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

COMMENT ON CONSTRAINT student_balance_date ON sims.student_loan_balances IS 'Ensures student loan balance for a particular student and the balance date is unique.';