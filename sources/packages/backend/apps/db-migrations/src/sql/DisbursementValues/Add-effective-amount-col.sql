ALTER TABLE
  sims.disbursement_values
ADD
  COLUMN IF NOT EXISTS effective_amount NUMERIC(8, 2);

COMMENT ON COLUMN sims.disbursement_values.effective_amount IS 'Value resulted from the calculation between the award value_amount, disbursed_amount_subtracted and overaward_amount_subtracted. This is the value that was sent on the e-Cert and effectively paid to the student.';