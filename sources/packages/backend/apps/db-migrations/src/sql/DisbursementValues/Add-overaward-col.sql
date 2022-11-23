ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS overaward NUMERIC(8, 2);

COMMENT ON COLUMN sims.disbursement_values.overaward IS 'Amount of value that was subtracted from the money value amount due to a previous student debit or due to a reassessment.';