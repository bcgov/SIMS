ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS sin VARCHAR(10);

-- Copy SIN from sin_validations to students.
UPDATE
    sims.students
SET
    sin = CAST(sims.sin_validations.sin AS VARCHAR(10))
FROM
    sims.sin_validations
WHERE
    sims.sin_validations.user_id = students.user_id;

-- Adjust sin column to be NOT NULL.
ALTER TABLE
    sims.students
ALTER COLUMN
    sin
SET
    NOT NULL;