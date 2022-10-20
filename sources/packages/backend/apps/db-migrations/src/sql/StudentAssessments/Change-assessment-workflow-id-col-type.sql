-- Changed the workflow instance id type to store the out-of-box identity
-- provided by Camunda 8 (e.g. 2251799814439587). It will also support
-- the current one (e.g. 38752a81-16ce-4f16-917c-719f8f37d9c0).
ALTER TABLE
    sims.student_assessments
ALTER COLUMN
    assessment_workflow_id TYPE VARCHAR(50);