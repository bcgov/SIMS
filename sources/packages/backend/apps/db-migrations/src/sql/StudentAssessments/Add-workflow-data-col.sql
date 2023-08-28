ALTER TABLE
    sims.student_assessments
ADD
    COLUMN workflow_data JSONB;

COMMENT ON COLUMN sims.student_assessments.workflow_data IS 'Output of workflow calculations and data used as calculations inputs. Represents workflow variables that must be persisted after the workflow is executed for easy application consumption.';