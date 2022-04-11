-- Prepare the database existing data to allow the index creation.
-- Search and update any assessment that have more than one record submitted/pending (assessment.assessment_data IS NULL)
-- which would prevent the index creation.
UPDATE
    sims.student_assessments
SET
    assessment_data = '{ "migration": "Updated to allow the creation of the create index student_assessments_only_one_assessment_data_null"}' :: json
WHERE
    assessment_data IS NULL
    AND application_id IN (
        SELECT
            assessment.application_id
        FROM
            sims.student_assessments assessment
        WHERE
            assessment.assessment_data IS NULL
        GROUP BY
            assessment.application_id
        HAVING
            count(*) > 1
    );

-- Create the index.
CREATE UNIQUE INDEX student_assessments_only_one_assessment_data_null ON sims.student_assessments (application_id, (assessment_data IS NULL))
WHERE
    assessment_data IS NULL;

COMMENT ON INDEX sims.student_assessments_only_one_assessment_data_null IS 'Ensures that a student application will have only one assessment waiting to be processed at a given time.';