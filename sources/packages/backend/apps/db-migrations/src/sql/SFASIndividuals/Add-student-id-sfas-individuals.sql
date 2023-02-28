ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN IF NOT EXISTS student_id INTEGER;

COMMENT ON COLUMN sims.sfas_individuals.student_id IS 'Student id used to import data to sims.disbursement_overawards table.';

ALTER TABLE
    sims.sfas_individuals
ADD
    CONSTRAINT fk_student_id_id FOREIGN KEY (student_id) REFERENCES students (id);

CREATE INDEX student_id ON sims.sfas_individuals(student_id);