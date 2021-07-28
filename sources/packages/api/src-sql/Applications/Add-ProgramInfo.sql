-- Create assessment_workflow_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS assessment_workflow_id UUID;

COMMENT ON COLUMN sims.applications.assessment_workflow_id IS 'Id of the Camunda workflow started to assess the student application.';

-- Create location_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS location_id INT REFERENCES sims.institution_locations(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.applications.location_id IS 'Location id associated with this application.';

-- Create offering_id
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS offering_id INT REFERENCES sims.education_programs_offerings(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.applications.offering_id IS 'Offering associated with the application.';

-- Create pir_status
ALTER TABLE
    sims.applications
ADD
    COLUMN IF NOT EXISTS pir_status sims.program_info_status;

COMMENT ON COLUMN sims.applications.pir_status IS 'Status of the Program Information Request(PIR) (e.g. required, not required, completed).';