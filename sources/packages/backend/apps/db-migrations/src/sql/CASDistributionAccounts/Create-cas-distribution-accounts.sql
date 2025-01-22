CREATE TABLE sims.cas_distribution_accounts(
  id SERIAL PRIMARY KEY,
  award_value_code VARCHAR(10) NOT NULL,
  operation_code CHAR(2) NOT NULL,
  is_active BOOLEAN NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

CREATE UNIQUE INDEX cas_distribution_accounts_award_value_code_operation_code ON sims.cas_distribution_accounts(award_value_code, operation_code)
WHERE
  (is_active = TRUE);

-- ## Comments
COMMENT ON TABLE sims.cas_distribution_accounts IS 'CAS distribution account information to be reported in invoices.';

COMMENT ON COLUMN sims.cas_distribution_accounts.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.cas_distribution_accounts.award_value_code IS 'SIMS award value codes.';

COMMENT ON COLUMN sims.cas_distribution_accounts.operation_code IS 'Codes for the operations, expected to be "DR" for debit and "CR" for credit.';

COMMENT ON COLUMN sims.cas_distribution_accounts.is_active IS 'Indicates if the distribution account for the award code is active. One pair of distribution accounts are expected to each award code (one for debit and one for credit).';

COMMENT ON COLUMN sims.cas_distribution_accounts.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.cas_distribution_accounts.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.cas_distribution_accounts.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.cas_distribution_accounts.modifier IS 'Modifier of the record.';