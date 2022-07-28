-- Add new column to save the identity provider type/
ALTER TABLE
    sims.users
ADD
    COLUMN IF NOT EXISTS identity_provider_type sims.identity_provider_types DEFAULT 'BCSC';

COMMENT ON COLUMN sims.users.identity_provider_type 'Identity provider that authenticated the user.';

-- Update all existing users based on the user_name suffix.
UPDATE
    sims.users
SET
    identity_provider_type = CASE
        WHEN user_name ILIKE '%@bceid' THEN 'BCEID'
        WHEN user_name ILIKE '%@idir' THEN 'IDIR'
        ELSE 'BCSC'
    END :: sims.identity_provider_types;

-- Remove the default constraint.
ALTER TABLE
    sims.users
ALTER COLUMN
    identity_provider_type DROP DEFAULT;