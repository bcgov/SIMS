-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.identity_provider_types_to_rollback AS ENUM ('BCEID', 'BCSC', 'IDIR');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.users
ALTER COLUMN
    identity_provider_type TYPE sims.identity_provider_types_to_rollback USING (
        CASE
            identity_provider_type :: text
            WHEN 'bceidbusiness' THEN 'BCEID'
            WHEN 'bceidbasic' THEN 'BCEID'
            WHEN 'bceidboth' THEN 'BCEID'
            WHEN 'bcsc' THEN 'BCSC'
            WHEN 'idir' THEN 'IDIR'
            ELSE identity_provider_type :: text
        END
    ) :: sims.identity_provider_types_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.identity_provider_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.identity_provider_types_to_rollback RENAME TO identity_provider_types;