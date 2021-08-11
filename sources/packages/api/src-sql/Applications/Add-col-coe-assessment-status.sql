ALTER TABLE sims.applications ADD COLUMN IF NOT EXISTS coe_status sims.coe_status;

COMMENT ON COLUMN sims.applications.coe_status IS 'Confirmation of Enrollment status information of the student application (Example: Required, Not Required, Completed, Declined)';

ALTER TABLE sims.applications ADD COLUMN IF NOT EXISTS assessment_status sims.assessment_status;

COMMENT ON COLUMN sims.applications.assessment_status IS 'Assessment status information of the student application (Example: Required, Not Required, Completed, Declined)';