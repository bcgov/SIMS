-- Add new column to save the identity provider type.
ALTER TABLE
    sims.users DROP COLUMN IF EXISTS identity_provider_type,
    DROP COLUMN IF EXISTS creator,
    DROP COLUMN IF EXISTS modifier;