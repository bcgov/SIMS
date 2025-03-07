-- Recreate the enums types when the new item must be added.
CREATE TYPE sims.cas_invoice_status_types_to_be_updated AS ENUM (
  'Pending',
  'Sent',
  'Manual Intervention',
  'Resolved'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.cas_invoices
ALTER COLUMN
  invoice_status TYPE sims.cas_invoice_status_types_to_be_updated USING (invoice_status :: text) :: sims.cas_invoice_status_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.cas_invoice_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.cas_invoice_status_types_to_be_updated RENAME TO cas_invoice_status;