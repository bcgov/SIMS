ALTER TABLE
    sims.applications
ADD
    COLUMN current_processing_assessment_id INT REFERENCES sims.student_assessments(id);

COMMENT ON COLUMN sims.applications.current_processing_assessment_id IS 'Represents the student assessment that is being processed currently. Differently from the current_assessment column, which points to the most recently created record, this column indicates the assessment currently being processed.';