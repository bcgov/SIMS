-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.restriction_types_to_be_updated AS ENUM ('Provincial', 'Federal');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    restriction_type TYPE sims.restriction_types_to_be_updated USING (restriction_type :: TEXT) :: sims.restriction_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.restriction_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.restriction_types_to_be_updated RENAME TO restriction_types;