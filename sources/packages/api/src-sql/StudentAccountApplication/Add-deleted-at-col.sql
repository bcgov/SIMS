ALTER TABLE
    sims.student_account_applications
ADD
    COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.student_account_applications.deleted_at IS 'When set indicates that the record is considered deleted.';