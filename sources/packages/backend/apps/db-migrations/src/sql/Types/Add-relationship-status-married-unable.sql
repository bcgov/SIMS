-- Recreate the enums types when the new item must be added.
CREATE TYPE sims.relationship_status_to_be_updated AS ENUM (
  'married',
  'single',
  'other',
  'marriedUnable'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.applications
ALTER COLUMN
  relationship_status TYPE sims.relationship_status_to_be_updated USING (relationship_status :: text) :: sims.relationship_status_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.relationship_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.relationship_status_to_be_updated RENAME TO relationship_status;