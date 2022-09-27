-- Clean the disbursement_schedules table to allow the addition of the 
-- student_assessment_id with a NOT NULL constraint.
DELETE FROM
    sims.disbursement_schedules;

ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS student_assessment_id INT NOT NULL REFERENCES sims.student_assessments(id) ON DELETE CASCADE;