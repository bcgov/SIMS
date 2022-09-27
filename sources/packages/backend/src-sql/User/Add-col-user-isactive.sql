ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN users.is_active IS 'This field decides whether the user is active or not, only active users can login to the system.';