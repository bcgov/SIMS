ALTER TABLE
    sims.students
ADD
    COLUMN IF NOT EXISTS sin_validation_id INT NOT NULL REFERENCES sims.sin_validations(id);

COMMENT ON COLUMN sims.students.sin_validation_id IS 'SIN validation record that indicates the current SIN validation status of this student.';