ALTER TABLE
    sims.students
ADD
    COLUMN disability_status_effective_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.students.disability_status_effective_date IS 'Disability status effective date.';