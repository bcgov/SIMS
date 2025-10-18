-- Remove the student_id column.
ALTER TABLE
    sims.student_appeals DROP COLUMN student_id;

-- Enforce NOT NULL constraint back on the application_id column.
ALTER TABLE
    sims.student_appeals
ALTER COLUMN
    application_id
SET
    NOT NULL;