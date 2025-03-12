ALTER TABLE
  sims.cas_invoices
ADD
  COLUMN invoice_status_updated_by INT REFERENCES sims.users(id);

COMMENT ON COLUMN sims.cas_invoices.invoice_status_updated_by IS 'User who updated the invoice status.';

-- Update the existing records with the creator.
UPDATE
  sims.cas_invoices
SET
  invoice_status_updated_by = creator;

-- Update the column to NOT NULL.
ALTER TABLE
  sims.cas_invoices
ALTER COLUMN
  invoice_status_updated_by
SET
  NOT NULL;