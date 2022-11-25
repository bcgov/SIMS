ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS overaward_amount_subtracted NUMERIC(8, 2);

ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS disbursed_amount_subtracted NUMERIC(8, 2);

-- TODO: ADD Comments