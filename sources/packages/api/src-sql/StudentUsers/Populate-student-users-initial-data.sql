-- Populate student_users with the current relation from the students table (id student_id, user_id, created_at).
INSERT INTO
    sims.student_users (student_id, user_id, created_at) (
        SELECT
            id student_id,
            user_id,
            created_at
        FROM
            sims.students
    );