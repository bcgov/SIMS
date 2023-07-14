ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS pd_status sims.permanent_disability_status;

COMMENT ON COLUMN sims.students.pd_status IS 'Permanent disability status of the student.';

-- Update the pd_status column based on pd_verified and pd_date_sent for existing data.
UPDATE
    sims.students
SET
    pd_status = CASE
        WHEN pd_verified IS NULL
        AND pd_date_sent IS NOT NULL THEN 'Requested'
        WHEN pd_verified = true THEN 'PD'
        WHEN pd_verified = false THEN 'Declined'
        ELSE 'Not requested' :: sims.permanent_disability_status
    END;

-- Set not null constraint after updating the column.
ALTER TABLE
    sims.students
ALTER COLUMN
    pd_status
SET
    NOT NULL;