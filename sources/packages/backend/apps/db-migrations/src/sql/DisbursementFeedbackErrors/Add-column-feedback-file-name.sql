-- Add column with default value to enforce NOT NULL.
-- Adding a dummy file name as default intended for non-production data.
ALTER TABLE
    sims.disbursement_feedback_errors
ADD
    COLUMN feedback_file_name VARCHAR(50) NOT NULL DEFAULT 'EDU.PBC.FTECERTSFB.DUMMY';

COMMENT ON COLUMN sims.disbursement_feedback_errors.feedback_file_name IS 'Integration file name that imported the feedback error.';

-- Drop default.
ALTER TABLE
    sims.disbursement_feedback_errors
ALTER COLUMN
    feedback_file_name DROP DEFAULT;