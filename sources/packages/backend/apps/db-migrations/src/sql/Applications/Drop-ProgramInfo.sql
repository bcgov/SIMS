-- Drop assessment_workflow_id
ALTER TABLE sims.applications
    DROP COLUMN IF EXISTS assessment_workflow_id;

-- Drop location_id
ALTER TABLE sims.applications
    DROP COLUMN IF EXISTS location_id;
    
-- Drop offering_id
ALTER TABLE sims.applications
    DROP COLUMN IF EXISTS offering_id;

-- Drop pir_status
ALTER TABLE sims.applications
    DROP COLUMN IF EXISTS pir_status;