ALTER TABLE sims.applications ADD COLUMN IF NOT EXISTS application_status sims.application_status;

COMMENT ON COLUMN sims.applications.application_status IS 'Status information of the student application (Example: Draft, In Progress, Assessment, Enrollment, Completed, Cancelled, Submitted)';