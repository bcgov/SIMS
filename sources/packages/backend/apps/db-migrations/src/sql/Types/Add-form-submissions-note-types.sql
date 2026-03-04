-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.note_types_to_be_updated AS ENUM (
  'General',
  'Application',
  'Student appeal',
  'Student form',
  'Program',
  'Restriction',
  'Designation',
  'Overaward',
  'System Actions'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.notes
ALTER COLUMN
  note_type TYPE sims.note_types_to_be_updated USING (note_type :: TEXT) :: sims.note_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.note_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.note_types_to_be_updated RENAME TO note_types;