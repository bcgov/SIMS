ALTER TABLE
    sims.student_assessments
ADD
    COLUMN calculation_start_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.student_assessments.calculation_start_date IS 'Assessment calculation start date.';