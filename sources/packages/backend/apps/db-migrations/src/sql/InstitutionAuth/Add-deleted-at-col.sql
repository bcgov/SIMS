ALTER TABLE
    sims.institution_user_auth
ADD
    COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.institution_user_auth.deleted_at IS 'When set indicates that the record is considered deleted.';