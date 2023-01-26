-- Remove the column to later add it back with the computed values.
ALTER TABLE
    sims.users DROP COLUMN identity_provider_type;

-- Add new column to save the identity provider type.
-- The column allow nulls to accept also, for instance, service users that are also saved to the
-- users tables but are not authenticated using an IDP.
ALTER TABLE
    sims.users
ADD
    COLUMN IF NOT EXISTS identity_provider_type sims.identity_provider_types GENERATED ALWAYS AS (
        CASE
            WHEN user_name LIKE '%@bceid' THEN 'BCEID' :: sims.identity_provider_types
            WHEN user_name LIKE '%@idir' THEN 'IDIR' :: sims.identity_provider_types
            WHEN user_name LIKE '%@bcsc' THEN 'BCSC' :: sims.identity_provider_types
        END
    ) STORED;

COMMENT ON COLUMN sims.users.identity_provider_type IS 'Identity provider that authenticated the user.';