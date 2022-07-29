-- Create the new column to keep the active relationship between student and user.
ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS active_student_user_id INT REFERENCES sims.student_users(id);

COMMENT ON COLUMN sims.students.active_student_user_id IS 'Current user associated with the student.';

-- Populate student_users with the current relation from the students table (id student_id, user_id).
INSERT INTO
    sims.student_users (student_id, user_id) (
        SELECT
            id student_id,
            user_id
        FROM
            sims.students
    );

-- Populate the new relationship between students and users.
UPDATE
    sims.students s
SET
    active_student_user_id = st.id
FROM
    sims.student_users st
WHERE
    st.user_id = s.user_id
    AND st.student_id = s.id;