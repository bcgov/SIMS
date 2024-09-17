-- Removing the value 'Stop part time BC funding' from sims.restriction_action_types for the rollback.
-- As postgres does not support removal of an Enum Value, we create a temporary enum and rename it.
CREATE TYPE sims.restriction_action_types_to_rollback AS ENUM (
  'No effect',
  'Stop full time BC funding',
  'Stop part time apply',
  'Stop full time apply',
  'Stop part time disbursement',
  'Stop full time disbursement'
);

-- Remove 'Stop part time BC funding' enum from any row that contains it.
UPDATE
  sims.restrictions
SET
  action_type = array_remove(action_type, 'Stop part time BC funding')
WHERE
  'Stop part time BC funding' = ANY(action_type);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.restrictions
ALTER COLUMN
  action_type TYPE sims.restriction_action_types_to_rollback [] USING (action_type :: TEXT) :: sims.restriction_action_types_to_rollback [];

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.restriction_action_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.restriction_action_types_to_rollback RENAME TO restriction_action_types;