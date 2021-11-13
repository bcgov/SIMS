CREATE TABLE IF NOT EXISTS sims.disbursement_values(
  id SERIAL PRIMARY KEY,
  value_type sims.disbursement_value_types NOT NULL,
  value_code VARCHAR(10) NOT NULL,
  value_amount NUMERIC(8, 2),
  -- Reference Columns
  disbursement_schedule_id INT NOT NULL REFERENCES sims.disbursement_schedules(id) ON DELETE
  SET
    NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.disbursement_values IS 'Disbursements values for each schedule on a Student Application.';

COMMENT ON COLUMN sims.disbursement_values.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.disbursement_values.value_type IS 'Generic type of the value (e.g. Canada Loan or BC Loan).';

COMMENT ON COLUMN sims.disbursement_values.value_code IS 'Specific code for the value to be disbursed (e.g. CSLF or BCSL).';

COMMENT ON COLUMN sims.disbursement_values.value_amount IS 'Amount of money to be disbursed for one particular loan/grant.';

COMMENT ON COLUMN sims.disbursement_values.disbursement_schedule_id IS 'Related disbursement schedule.';

COMMENT ON COLUMN sims.disbursement_values.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.disbursement_values.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.disbursement_values.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.disbursement_values.modifier IS 'Modifier of the record. Null specified the record is modified by system';