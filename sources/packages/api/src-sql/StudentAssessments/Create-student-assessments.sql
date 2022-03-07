CREATE TABLE IF NOT EXISTS sims.student_assessments (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE,
    assessment_workflow_id UUID,
    assessment_data jsonb NOT NULL,
    trigger_type sims.assessment_trigger_types NOT NULL,
    offering_id INT REFERENCES sims.education_programs_offerings(id) ON DELETE CASCADE,
    student_appeal_id INT REFERENCES sims.student_appeals(id) ON DELETE CASCADE,
    student_scholastic_standing_id INT REFERENCES sims.student_scholastic_standings(id) ON DELETE CASCADE,
    noa_approval_status sims.assessment_status NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.student_assessments IS 'Represents all the assessments and reassessments processed for a particular Student Application. When a assessment/reassessment is needed it will use the information present in the application itself combined with the additional data present in this table (e.g. student appeals and scholastic standing changes).';

COMMENT ON COLUMN sims.student_assessments.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_assessments.application_id IS 'Application related to this assessment.';

COMMENT ON COLUMN sims.student_assessments.assessment_workflow_id IS 'Workflow instance that processed this assessment.';

COMMENT ON COLUMN sims.student_assessments.assessment_data IS 'Represent the output of the executed assessment workflow and it is also the main content for the NOA.';

COMMENT ON COLUMN sims.student_assessments.trigger_type IS 'Identifies what was the reason to the assessment happen. Usually one completed Student Application will have only one record of type "Original assessment". If more records are present they represents a reassessment that happened after the Student Application was completed, for instance, due to a student appeal.';

COMMENT ON COLUMN sims.student_assessments.offering_id IS 'Offering id that must be used for any assessment/reassessment. This information can be null only during a PIR process. Upon a program/offering change, this will also represent the new/changed program/offering';

COMMENT ON COLUMN sims.student_assessments.student_appeal_id IS 'When the reassessment happen due to a student appeal, this will provide to the workflow the data that need to be changed.';

COMMENT ON COLUMN sims.student_assessments.student_scholastic_standing_id IS 'When the reassessment happen due to a scholastic standing change (e.g. student withdrawal), this will provide to the workflow the data that need be changed.';

COMMENT ON COLUMN sims.student_assessments.noa_approval_status IS 'Indicates the status of the NOA approval when the student must approve the money values prior to the institution COE approval and disbursements.';

COMMENT ON COLUMN sims.student_assessments.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN sims.student_assessments.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN sims.student_assessments.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN sims.student_assessments.modifier IS 'Modifier of the record. Null specified the record is modified by system';