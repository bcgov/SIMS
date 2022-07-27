ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS student_user_id INT REFERENCES sims.student_users(id);

COMMENT ON COLUMN sims.students.student_user_id IS 'Current user associated with the student.';