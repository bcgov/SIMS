-- Recreate the enums types when the new item must be added.
CREATE TYPE sims.disbursement_overaward_origin_types_to_be_updated AS ENUM (
    'Reassessment overaward',
    'Award deducted',
    'Manual record',
    'Legacy overaward',
    'Award rejected deducted'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.disbursement_overawards
ALTER COLUMN
    origin_type TYPE sims.disbursement_overaward_origin_types_to_be_updated USING (origin_type :: text) :: sims.disbursement_overaward_origin_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.disbursement_overaward_origin_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.disbursement_overaward_origin_types_to_be_updated RENAME TO disbursement_overaward_origin_types;