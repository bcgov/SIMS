-- Add the column with valid_sin.
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS valid_sin BOOLEAN;
   
COMMENT ON COLUMN students.valid_sin
    IS 'Indicates the status of the Student SIN validation, where NULL means that it is pending, TRUE means that it is valid and FALSE means that it is not valid.';

