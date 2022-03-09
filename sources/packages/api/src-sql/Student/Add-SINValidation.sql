ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS sin_validations_id INT REFERENCES sims.sin_validations(id);

COMMENT ON COLUMN sims.students.sin_validations_id IS 'SIN Validations table associated with this student.';