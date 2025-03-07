-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.cas_invoice_status_types_to_rollback AS ENUM ('Pending', 'Sent', 'Manual Intervention');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.cas_invoices
ALTER COLUMN
  invoice_status TYPE sims.cas_invoice_status_types_to_rollback USING (
    CASE
      invoice_status :: text
      WHEN 'Resolved' THEN 'Manual Intervention'
      ELSE invoice_status :: text
    END
  ) :: sims.cas_invoice_status_types_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.cas_invoice_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.cas_invoice_status_types_to_rollback RENAME TO cas_invoice_status;