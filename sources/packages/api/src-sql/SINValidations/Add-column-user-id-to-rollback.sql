ALTER TABLE
    sims.sin_validations
ADD
    COLUMN IF NOT EXISTS user_id INT REFERENCES sims.students(id);

COMMENT ON COLUMN sims.sin_validations.user_id IS 'Foreign key reference to users table which includes users related information.';