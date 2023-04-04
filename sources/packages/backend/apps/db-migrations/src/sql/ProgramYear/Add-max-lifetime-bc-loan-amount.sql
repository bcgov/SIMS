ALTER TABLE
  sims.program_years
ADD
  COLUMN max_lifetime_bc_loan_amount NUMERIC(8, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN sims.program_years.max_lifetime_bc_loan_amount IS 'Maximum lifetime amount for BCSL for the program year.';

UPDATE
  sims.program_years
SET
  max_lifetime_bc_loan_amount = 50000
WHERE
  program_year IN ('2021-2022', '2022-2023', '2023-2024');

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an existing table.
ALTER TABLE
  sims.program_years
ALTER COLUMN
  max_lifetime_bc_loan_amount DROP DEFAULT;