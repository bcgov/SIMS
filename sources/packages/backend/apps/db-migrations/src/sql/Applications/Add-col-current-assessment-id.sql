ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS current_assessment_id INT REFERENCES sims.student_assessments(id) ON DELETE CASCADE;

COMMENT ON COLUMN sims.applications.current_assessment_id IS 'Represents the assessment that holds the current information for this application. The application could have many assessments but only one should be considered as the "current/active" at one point in time.';