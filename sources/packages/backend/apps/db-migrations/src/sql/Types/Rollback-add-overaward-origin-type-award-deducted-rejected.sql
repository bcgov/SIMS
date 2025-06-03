-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.disbursement_overaward_origin_types_to_rollback AS ENUM (
    'Reassessment overaward',
    'Award deducted',
    'Manual record',
    'Legacy overaward'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.disbursement_overawards
ALTER COLUMN
    origin_type TYPE sims.disbursement_overaward_origin_types_to_rollback USING (
        CASE
            origin_type :: text
            WHEN 'Award deducted rejected' THEN 'Award deducted'
            ELSE origin_type :: text
        END
    ) :: sims.disbursement_overaward_origin_types_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.disbursement_overaward_origin_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.disbursement_overaward_origin_types_to_rollback RENAME TO disbursement_overaward_origin_types;