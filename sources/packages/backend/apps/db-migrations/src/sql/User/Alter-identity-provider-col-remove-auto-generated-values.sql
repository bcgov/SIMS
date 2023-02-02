ALTER TABLE
    sims.users DROP COLUMN identity_provider_type;

ALTER TABLE
    sims.users
ADD
    COLUMN identity_provider_type sims.identity_provider_types;

COMMENT ON COLUMN sims.users.identity_provider_type IS 'Identity provider that authenticated the user. BCeID basic/business are authenticated using a single IDP, and based on the presence of a business GUID the system persists here the specific one.';