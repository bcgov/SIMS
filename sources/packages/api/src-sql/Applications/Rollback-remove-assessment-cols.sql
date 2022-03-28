-- Add assessment
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS assessment JSONB;

COMMENT ON COLUMN sims.applications.assessment IS 'Assessment information after it is calculated from camunda workflow in the student application.';

-- Add assessment_workflow_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS assessment_workflow_id UUID;

COMMENT ON COLUMN sims.applications.assessment_workflow_id IS 'Id of the Camunda workflow started to assess the student application.';

-- Add offering_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS offering_id INT REFERENCES sims.education_programs_offerings(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.applications.offering_id IS 'Offering associated with the application.';

-- Add assessment_status
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS assessment_status sims.assessment_status;

COMMENT ON COLUMN sims.applications.assessment_status IS 'Assessment status information of the student application (Example: Required, Not Required, Completed, Declined)';