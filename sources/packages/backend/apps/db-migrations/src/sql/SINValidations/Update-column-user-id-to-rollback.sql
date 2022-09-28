-- Populate the user_id column through the student_id in sims.sin_validations to rollback student_id
-- reference to user_id.
UPDATE
    sims.sin_validations sv
SET
    user_id = (
        SELECT
            user_id
        FROM
            sims.students
        WHERE
            id = sv.student_id
    );

-- Once the student_id column is populated then make the column not null.
ALTER TABLE
    sims.sin_validations
ALTER COLUMN
    user_id
SET
    NOT NULL;