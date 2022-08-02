-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.offering_status_to_rollback AS ENUM (
    'Pending',
    'Approved',
    'Declined',
    'Under review',
    'Awaiting approval'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    offering_status TYPE sims.offering_status_to_rollback USING (
        CASE
            offering_status :: text
            WHEN 'Change overwritten' THEN 'Under review'
            WHEN 'Change declined' THEN 'Awaiting approval'
            ELSE offering_status :: text
        END
    ) :: sims.offering_status_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.offering_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.offering_status_to_rollback RENAME TO offering_status;