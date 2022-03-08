CREATE TABLE IF NOT EXISTS sims.student_scholastic_standings (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE,
  submitted_data jsonb NOT NULL,
  submitted_by INT NOT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    submitted_date TIMESTAMP WITH TIME ZONE NOT NULL,
    scholastic_standing_status sims.scholastic_standing_status NOT NULL,
    approved_data jsonb,
    assessed_date TIMESTAMP WITH TIME ZONE,
    assessed_by INT REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    note_id INT REFERENCES sims.notes(id) ON DELETE
  SET
    NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL
);

-- ## Comments
COMMENT ON TABLE sims.student_scholastic_standings IS 'Represents a scholastic standing change requested by the Institution due to some change in the student situation for a particular Student Application.';

COMMENT ON COLUMN sims.student_scholastic_standings.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_scholastic_standings.application_id IS 'Student Application where the scholastic standing was requested.';

COMMENT ON COLUMN sims.student_scholastic_standings.submitted_data IS 'Dynamic form data that represents the scholastic standing change requested by the Institution.';

COMMENT ON COLUMN sims.student_scholastic_standings.submitted_by IS 'Institution user that submitted the scholastic standing.' COMMENT ON COLUMN sims.student_scholastic_standings.submitted_date IS 'Date that the Institution user submitted the scholastic standing.' COMMENT ON COLUMN sims.student_scholastic_standings.approved_data IS 'Dynamic form data that represents the final data revised by the Ministry.';

COMMENT ON COLUMN sims.student_scholastic_standings.scholastic_standing_status IS 'Status of the current request (e.g. Pending, Approved, Denied).';

COMMENT ON COLUMN sims.student_scholastic_standings.assessed_date IS 'Date that the Ministry approved or denied the appeal.';

COMMENT ON COLUMN sims.student_scholastic_standings.assessed_by IS 'Ministry user that approved or denied the appeal.';

COMMENT ON COLUMN sims.student_scholastic_standings.note_id IS 'Note added by the Ministry while approving or denying the appeal.';

COMMENT ON COLUMN sims.student_scholastic_standings.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_scholastic_standings.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_scholastic_standings.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.student_scholastic_standings.modifier IS 'Modifier of the record. Null specified the record is modified by system.';