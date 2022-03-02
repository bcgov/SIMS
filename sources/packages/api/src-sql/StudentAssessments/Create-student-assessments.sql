/* Indirect statuses.
 - Pending: assessment_workflow_id is null
 - In Progress: assessment_workflow_id is NOT null and assessment_data is null
 - Completed: assessment_data in NOT null
 */
CREATE TABLE IF NOT EXISTS sims.student_assessments (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE,
    -- Will be moved from sims.applications.
    assessment_workflow_id UUID,
    -- Will be moved from sims.applications.
    assessment_data jsonb NOT NULL,
    trigger_type sims.assessment_trigger_types NOT NULL,
    -- Will be moved from sims.applications.
    offering_id INT REFERENCES sims.education_programs_offerings(id) ON DELETE CASCADE,
    student_appeal_id INT REFERENCES sims.student_appeals(id) ON DELETE CASCADE,
    student_scholastic_standing_id INT REFERENCES sims.student_scholastic_standings(id) ON DELETE CASCADE,
    -- Will be moved from sims.applications.
    assessment_status sims.assessment_status NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE
    SET
        NULL
);