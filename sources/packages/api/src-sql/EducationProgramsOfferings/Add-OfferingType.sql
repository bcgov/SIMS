ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN offering_type sims.offering_types NOT NULL DEFAULT 'public';

COMMENT ON COLUMN sims.applications.assessment_workflow_id IS 'Type of the education offering.';