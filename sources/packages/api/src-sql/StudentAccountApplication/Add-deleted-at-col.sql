ALTER TABLE
    sims.student_account_applications
ADD
    COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;