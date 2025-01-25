CREATE TABLE sims.cas_invoice_batches(
  id SERIAL PRIMARY KEY,
  batch_name VARCHAR(50) NOT NULL,
  batch_date TIMESTAMP WITH TIME ZONE NOT NULL,
  approval_status sims.cas_invoice_batch_approval_status NOT NULL,
  approval_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL,
  approval_status_updated_by INT NOT NULL REFERENCES sims.users(id),
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
  UNIQUE (batch_name)
);

-- ## Comments
COMMENT ON TABLE sims.cas_invoice_batches IS 'CAS batch information to group disbursement invoices.';

COMMENT ON COLUMN sims.cas_invoice_batches.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.cas_invoice_batches.batch_name IS 'Unique batch name.';

COMMENT ON COLUMN sims.cas_invoice_batches.batch_date IS 'Batch date.';

COMMENT ON COLUMN sims.cas_invoice_batches.approval_status IS 'Approval status.';

COMMENT ON COLUMN sims.cas_invoice_batches.approval_status_updated_on IS 'Last date and time when the status changed.';

COMMENT ON COLUMN sims.cas_invoice_batches.approval_status_updated_by IS 'User that changed the status last time.';

COMMENT ON COLUMN sims.cas_invoice_batches.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.cas_invoice_batches.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.cas_invoice_batches.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.cas_invoice_batches.modifier IS 'Modifier of the record.';