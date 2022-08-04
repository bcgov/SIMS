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
            WHEN user_name LIKE '%@bceid' THEN 'BCSC' :: sims.identity_provider_types
        END
    ) STORED;

COMMENT ON COLUMN sims.users.identity_provider_type IS 'Identity provider that authenticated the user.';

-- Missing audit columns.
ALTER TABLE
    sims.users
ADD
    COLUMN creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
ADD
    COLUMN modifier INT NULL DEFAULT NULL REFERENCES sims.users(id);

COMMENT ON COLUMN sims.users.creator IS 'Creator of the record. The user can be created by himself, while login into the system or by the Ministry or by the Institution on his behalf.';

COMMENT ON COLUMN sims.users.modifier IS 'Modifier of the record.';