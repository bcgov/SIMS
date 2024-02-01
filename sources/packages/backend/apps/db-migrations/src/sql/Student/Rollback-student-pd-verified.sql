-- Add the column with pd_verified.
ALTER TABLE
    sims.students
ADD
    COLUMN pd_verified BOOLEAN;

COMMENT ON COLUMN sims.students.pd_verified IS 'Permanent Disability Verification status of the Student';