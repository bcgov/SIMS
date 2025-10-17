-- Create new column to link student appeals to students directly
-- allowing appeals to be created without an application association.
ALTER TABLE
    sims.student_appeals
ADD
    COLUMN student_id int REFERENCES sims.students(id);

COMMENT ON COLUMN sims.student_appeals.student_id IS 'The student associated with the appeal. An appeal may or may not be linked to an application, but it must be linked to a student.';

-- Populate the new student_id column based on existing application associations.
UPDATE
    sims.student_appeals
SET
    student_id = applications.student_id
FROM
    sims.applications
WHERE
    applications.id = student_appeals.application_id;

-- Enforce NOT NULL constraint on the new student_id column.
ALTER TABLE
    sims.student_appeals
ALTER COLUMN
    student_id
SET
    NOT NULL;

-- Alter the application_id column to allow NULLs since appeals can now be
-- created without an application association.
ALTER TABLE
    sims.student_appeals
ALTER COLUMN
    application_id DROP NOT NULL;