-- Populate the student_id column through the user_id in sims.sin_validations.
UPDATE
    sims.sin_validations sv
SET
    student_id = (
        SELECT
            id
        FROM
            sims.students
        WHERE
            user_id = sv.user_id
    );

-- Once the student_id column is populated then make the column not null.
ALTER TABLE
    sims.sin_validations
ALTER COLUMN
    student_id
SET
    NOT NULL;