ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN IF NOT EXISTS student_id INTEGER REFERENCES sims.students(id);

COMMENT ON COLUMN sims.sfas_individuals.student_id IS 'Existing student id identified by the combination of SIN, last name, and date of birth.';

CREATE INDEX student_id ON sims.sfas_individuals(student_id);