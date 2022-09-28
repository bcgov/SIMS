ALTER TABLE "institution_users" ADD COLUMN IF NOT EXISTS "user_guid" VARCHAR(100) NULL;

COMMENT ON COLUMN institution_users.user_guid IS 'The guid colum to store BCeID GUID. This value will be used to create advance user in system';