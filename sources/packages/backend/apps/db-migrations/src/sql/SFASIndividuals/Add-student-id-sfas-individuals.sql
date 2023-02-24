-- 
ALTER TABLE
    sims.sfas_individuals
ADD
    COLUMN IF NOT EXISTS student_id INTEGER NULL;

CREATE INDEX student_id ON sims.sfas_individuals(student_id);

COMMENT ON COLUMN sims.sfas_individuals.student_id IS 'Student id used to import data to sims.disbursement_overawards table and no integrity check was added for performance reasons.';