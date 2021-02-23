
-- Add the column with pd_verified.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS pd_verified BOOLEAN DEFAULT ;
   
-- -- Removing the dummy constraint created just to allow us
-- -- to add a "NOT NULL" column in an exising table.
-- ALTER TABLE students
--     ALTER COLUMN pd_verified DROP DEFAULT;

COMMENT ON COLUMN students.pd_verified
    IS 'Permanent Disability Verification status of the Student';

