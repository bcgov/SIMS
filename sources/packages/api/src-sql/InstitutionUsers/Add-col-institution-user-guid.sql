ALTER TABLE "institution_users" ADD COLUMN IF NOT EXISTS "guid" VARCHAR(100) NULL;

COMMENT ON COLUMN institution_users.guid IS 'The guid colum to store BCeID GUID. This value will be used to create advance user in system';