-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.supplier_status_to_be_updated AS ENUM (
  'Pending supplier verification',
  'Pending address verification',
  'Verified',
  'Verified manually',
  'Manual intervention'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.cas_suppliers
ALTER COLUMN
  supplier_status TYPE sims.supplier_status_to_be_updated USING (supplier_status :: TEXT) :: sims.supplier_status_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.supplier_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.supplier_status_to_be_updated RENAME TO supplier_status;