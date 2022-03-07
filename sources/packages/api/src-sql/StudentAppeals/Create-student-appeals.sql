CREATE TABLE IF NOT EXISTS sims.student_appeals (
    id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES sims.applications (id) ON DELETE CASCADE,
    -- Audit columns
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW (),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW (),
    creator INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.student_appeals IS 'Represents as set of appeals requested by a student, for instance, to have his income or dependents data changed on his Student Application after it was completed.';

COMMENT ON COLUMN sims.student_appeals.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_appeals.application_id IS 'Application that will be changed by the appeals requested.';

COMMENT ON COLUMN sims.student_appeals.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_appeals.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_appeals.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.student_appeals.modifier IS 'Modifier of the record. Null specified the record is modified by system.';