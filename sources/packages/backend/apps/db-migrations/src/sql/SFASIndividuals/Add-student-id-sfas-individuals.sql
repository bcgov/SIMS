ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN IF NOT EXISTS student_id INTEGER REFERENCES sims.students(id);

COMMENT ON COLUMN sims.sfas_individuals.student_id IS 'Student id used to import data to sims.disbursement_overawards table.';

CREATE INDEX student_id ON sims.sfas_individuals(student_id);