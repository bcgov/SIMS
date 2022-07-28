ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS active_student_user_id INT REFERENCES sims.student_users(id);

COMMENT ON COLUMN sims.students.active_student_user_id IS 'Current user associated with the student.';