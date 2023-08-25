ALTER TABLE
    sims.student_assessments
ADD
    COLUMN workflow_data JSONB;

COMMENT ON COLUMN sims.student_assessments.workflow_data IS 'Workflow details data.';