ALTER TABLE
    sims.sin_validations
ADD
    COLUMN IF NOT EXISTS student_id INT REFERENCES sims.students(id);

COMMENT ON COLUMN sims.sin_validations.student_id IS 'Student to whom the SIN validation record belongs to.';