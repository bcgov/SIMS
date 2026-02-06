-- Set the creator field for applications using the mapped user ID from the student ID.
-- This migration handles application change requests and other applications that were created with a NULL creator.
-- The creator is set to the student's user ID from the student table.
UPDATE
    sims.applications
SET
    creator = s.user_id
FROM
    sims.students s
WHERE
    sims.applications.student_id = s.id
    AND sims.applications.creator IS NULL;

-- Alter the creator field to NOT NULL after setting the values.
ALTER TABLE
    sims.applications
ALTER COLUMN
    creator
SET
    NOT NULL;