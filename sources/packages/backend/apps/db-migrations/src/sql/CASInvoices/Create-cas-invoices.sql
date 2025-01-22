CREATE TABLE sims.cas_invoices(
  id SERIAL PRIMARY KEY,
  cas_invoice_batch_id INT NOT NULL REFERENCES sims.cas_invoice_batches(id),
  disbursement_receipt_id INT NOT NULL REFERENCES sims.disbursement_receipts(id),
  cas_supplier_id INT NOT NULL REFERENCES sims.cas_suppliers(id),
  invoice_number VARCHAR(40) NOT NULL,
  invoice_status sims.cas_invoice_status NOT NULL,
  invoice_status_updated_on TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id),
  UNIQUE (invoice_number)
);

-- ## Comments
COMMENT ON TABLE sims.cas_invoices IS 'CAS invoices related to an e-Cert receipt and part of a batch to be reported to CAS.';

COMMENT ON COLUMN sims.cas_invoices.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.cas_invoices.cas_invoice_batch_id IS 'Related batch that this invoice belongs to.';

COMMENT ON COLUMN sims.cas_invoices.disbursement_receipt_id IS 'e-Cert receipt that this invoice is related to.';

COMMENT ON COLUMN sims.cas_invoices.cas_supplier_id IS 'Active CAS supplier associated with the student.';

COMMENT ON COLUMN sims.cas_invoices.invoice_number IS 'Unique invoice number.';

COMMENT ON COLUMN sims.cas_invoices.invoice_status IS 'Status of the invoice indicating if it was sent to CAS.';

COMMENT ON COLUMN sims.cas_invoices.invoice_status_updated_on IS 'Date and time when the invoice status was updated.';

COMMENT ON COLUMN sims.cas_invoices.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.cas_invoices.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.cas_invoices.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.cas_invoices.modifier IS 'Modifier of the record.';