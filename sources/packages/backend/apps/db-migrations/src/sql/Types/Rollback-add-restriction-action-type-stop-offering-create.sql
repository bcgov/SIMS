-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.restriction_action_types_to_be_updated AS ENUM (
    'No effect',
    'Stop full-time BC loan',
    'Stop full-time BC grants',
    'Stop part-time BC grants',
    'Stop part-time apply',
    'Stop full-time apply',
    'Stop part-time disbursement',
    'Stop full-time disbursement'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    action_type TYPE sims.restriction_action_types_to_be_updated [] USING (action_type :: text []) :: sims.restriction_action_types_to_be_updated [];

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.restriction_action_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.restriction_action_types_to_be_updated RENAME TO restriction_action_types;