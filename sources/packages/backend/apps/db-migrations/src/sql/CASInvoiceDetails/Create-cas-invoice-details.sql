CREATE TABLE sims.cas_invoice_details(
  id SERIAL PRIMARY KEY,
  cas_invoice_id INT NOT NULL REFERENCES sims.cas_invoices(id),
  cas_distribution_account_id INT NOT NULL REFERENCES sims.cas_distribution_accounts(id),
  value_amount NUMERIC(8, 2) NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
  UNIQUE (cas_invoice_id, cas_distribution_account_id)
);

-- ## Comments
COMMENT ON TABLE sims.cas_invoice_details IS 'CAS invoice details with every distribution account active for the award codes part of an e-Cert receipt.';

COMMENT ON COLUMN sims.cas_invoice_details.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.cas_invoice_details.cas_invoice_id IS 'Related invoice.';

COMMENT ON COLUMN sims.cas_invoice_details.cas_distribution_account_id IS 'Active distribution account for the award code.';

COMMENT ON COLUMN sims.cas_invoice_details.value_amount IS 'Award money value amount.';

COMMENT ON COLUMN sims.cas_invoice_details.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.cas_invoice_details.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.cas_invoice_details.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.cas_invoice_details.modifier IS 'Modifier of the record.';