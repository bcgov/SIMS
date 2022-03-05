
-- Add the column with pd_verified.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS pd_verified BOOLEAN;
   
COMMENT ON COLUMN students.pd_verified
    IS 'Permanent Disability Verification status of the Student';

