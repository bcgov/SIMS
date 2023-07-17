ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS disability_status sims.disability_status;

COMMENT ON COLUMN sims.students.disability_status IS 'Disability status of the student.';

-- Update the disability_status column based on pd_verified and pd_date_sent for existing data.
UPDATE
    sims.students
SET
    disability_status = CASE
        WHEN pd_verified IS NULL
        AND pd_date_sent IS NOT NULL THEN 'Requested'
        WHEN pd_verified = true THEN 'PD'
        WHEN pd_verified = false THEN 'Declined'
        ELSE 'Not requested' :: sims.disability_status
    END;

-- Set not null constraint after updating the column.
ALTER TABLE
    sims.students
ALTER COLUMN
    disability_status
SET
    NOT NULL;