ALTER TABLE
    sims.student_assessments
ADD
    COLUMN eligible_application_appeals VARCHAR(100) [];

COMMENT ON COLUMN sims.student_assessments.eligible_application_appeals IS 'Application appeal names which are eligible for the application.';