ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS overaward_amount_subtracted NUMERIC(8, 2);

ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS disbursed_amount_subtracted NUMERIC(8, 2);

-- ## Comments
COMMENT ON COLUMN sims.disbursement_values.overaward_amount_subtracted IS 'Overaward amount value subtracted from the award calculated.';

COMMENT ON COLUMN sims.disbursement_values.disbursed_amount_subtracted IS 'Value amount already disbursed for the same application and the same award that was subtracted from the calculated award.';