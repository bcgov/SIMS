CREATE TABLE IF NOT EXISTS sims.student_appeal_requests (
    id SERIAL PRIMARY KEY,
    student_appeal_id INT NOT NULL REFERENCES sims.student_appeals(id) ON DELETE CASCADE,
    submitted_data jsonb NOT NULL,
    submitted_form_name VARCHAR (100) NOT NULL,
    appeal_status sims.student_appeal_status NOT NULL,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        note_id INT REFERENCES sims.notes (id) ON DELETE
    SET
        NULL,
        -- Audit columns
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
        creator INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users (id) ON DELETE
    SET
        NULL
);

-- ## Comments
COMMENT ON TABLE sims.student_appeal_requests IS 'Represents as individual appeal requested by a student, for instance, to have his income or dependents data changed on his Student Application after it was completed.';

COMMENT ON COLUMN sims.student_appeal_requests.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_appeal_requests.student_appeal_id IS 'Relationship with the master appeal record that groups this individual ones when the Student needs an appeal. One or more can be requested at the same time.';

COMMENT ON COLUMN sims.student_appeal_requests.submitted_data IS 'Dynamic form data that represents the appeal.';

COMMENT ON COLUMN sims.student_appeal_requests.submitted_form_name IS 'Dynamic form name used to request the appeal.';

COMMENT ON COLUMN sims.student_appeal_requests.appeal_status IS 'Current status of the appeal (e.g. Pending, Approved, Denied).';

COMMENT ON COLUMN sims.student_appeal_requests.assessed_date IS 'Date that the Ministry approved or denied the appeal.';

COMMENT ON COLUMN sims.student_appeal_requests.assessed_by IS 'Ministry user that approved or denied the appeal.';

COMMENT ON COLUMN sims.student_appeal_requests.note_id IS 'Note added by the Ministry while approving or denying the appeal.';

COMMENT ON COLUMN sims.student_appeal_requests.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_appeal_requests.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_appeal_requests.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.student_appeal_requests.modifier IS 'Modifier of the record. Null specified the record is modified by system.';