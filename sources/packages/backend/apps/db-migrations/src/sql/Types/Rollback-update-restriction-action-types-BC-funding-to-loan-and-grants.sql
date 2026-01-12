-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.restriction_action_types_to_be_updated AS ENUM (
    'No effect',
    'Stop full time BC funding',
    'Stop part time BC funding',
    'Stop part time apply',
    'Stop full time apply',
    'Stop part time disbursement',
    'Stop full time disbursement'
);

-- Update the dependent column to a temporary type to allow updating the values.
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    action_type TYPE text [];

-- Update the dependent column to start using the new enum with the expected values.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY(
        SELECT
            CASE
                action_type_item
                WHEN 'Stop full-time BC loan' THEN 'Stop full time BC funding'
                WHEN 'Stop full-time BC grants' THEN 'Stop full time BC funding'
                WHEN 'Stop part-time BC grants' THEN 'Stop part time BC funding'
                WHEN 'Stop part-time apply' THEN 'Stop part time apply'
                WHEN 'Stop full-time apply' THEN 'Stop full time apply'
                WHEN 'Stop part-time disbursement' THEN 'Stop part time disbursement'
                WHEN 'Stop full-time disbursement' THEN 'Stop full time disbursement'
                ELSE action_type_item
            END
        FROM
            unnest(action_type) AS action_type_item
    );

-- Add back the enum type to the dependent column.
ALTER TABLE
    sims.restrictions
ALTER COLUMN
    action_type TYPE sims.restriction_action_types_to_be_updated [] USING action_type :: sims.restriction_action_types_to_be_updated [];

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.restriction_action_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.restriction_action_types_to_be_updated RENAME TO restriction_action_types;