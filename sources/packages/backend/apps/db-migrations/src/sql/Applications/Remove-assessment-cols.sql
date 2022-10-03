/*
 * Removing columns moved to the sims.student_assessments table after the
 * DB structure was changed to accommodate the reassessments.
 */
ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS assessment;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS assessment_workflow_id;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS offering_id;

ALTER TABLE
    sims.applications DROP COLUMN IF EXISTS assessment_status;