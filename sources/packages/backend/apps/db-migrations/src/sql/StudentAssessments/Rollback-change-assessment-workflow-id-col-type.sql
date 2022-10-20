-- This rollback script is intended to be used right after the upgrade script was executed.
-- If data was added to DB that is no longer compatible with the UUID format please remove
-- or change this data accordingly to allow the script to be executed.
ALTER TABLE
    sims.student_assessments
ALTER COLUMN
    assessment_workflow_id TYPE UUID USING uuid(assessment_workflow_id)