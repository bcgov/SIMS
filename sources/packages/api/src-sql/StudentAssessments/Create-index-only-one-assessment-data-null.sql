CREATE UNIQUE INDEX student_assessments_only_one_assessment_data_null ON sims.student_assessments (application_id, (assessment_data IS NULL))
WHERE
    assessment_data IS NULL;

COMMENT ON INDEX student_assessments_only_one_assessment_data_null IS 'Ensures that a student application will have only one assessment waiting to be processed at a given time.';