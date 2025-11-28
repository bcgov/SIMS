-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
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