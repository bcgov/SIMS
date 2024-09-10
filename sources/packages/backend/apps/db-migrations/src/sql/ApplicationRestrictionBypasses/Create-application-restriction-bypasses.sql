CREATE TABLE sims.application_restriction_bypasses (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES sims.applications(id),
  student_restriction_id INT NOT NULL REFERENCES sims.student_restrictions(id),
  bypass_behavior sims.restriction_bypass_behaviors NOT NULL,
  is_active BOOLEAN NOT NULL,
  creation_note_id INT NOT NULL REFERENCES sims.notes(id),
  bypass_created_by INT NOT NULL REFERENCES sims.users(id),
  bypass_created_date TIMESTAMP WITH TIME ZONE NOT NULL,
  removal_note_id INT REFERENCES sims.notes(id),
  bypass_removed_by INT REFERENCES sims.users(id),
  bypass_removed_date TIMESTAMP WITH TIME ZONE,
  -- Audit columns
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW (),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id),
  modifier INT NULL DEFAULT NULL REFERENCES sims.users(id)
);

-- ## Comments
COMMENT ON TABLE sims.application_restriction_bypasses IS 'Restrictions bypass that allow awards to be disbursed ignoring restrictions at the student application level.';

COMMENT ON COLUMN sims.application_restriction_bypasses.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.application_restriction_bypasses.application_id IS 'Reference to the student application that will have the bypass applied.';

COMMENT ON COLUMN sims.application_restriction_bypasses.student_restriction_id IS 'Active student restriction to be bypassed.';

COMMENT ON COLUMN sims.application_restriction_bypasses.bypass_behavior IS 'Defines how the bypass should behave, for instance, until when it will be valid.';

COMMENT ON COLUMN sims.application_restriction_bypasses.is_active IS 'Indicates if the bypass should be considered active.';

COMMENT ON COLUMN sims.application_restriction_bypasses.creation_note_id IS 'Note when the bypass was created.';

COMMENT ON COLUMN sims.application_restriction_bypasses.bypass_created_by IS 'User that created the bypass.';

COMMENT ON COLUMN sims.application_restriction_bypasses.bypass_created_date IS 'Date and time the bypass was created.';

COMMENT ON COLUMN sims.application_restriction_bypasses.removal_note_id IS 'Note when the bypass was removed.';

COMMENT ON COLUMN sims.application_restriction_bypasses.bypass_removed_by IS 'User that removed the bypass.';

COMMENT ON COLUMN sims.application_restriction_bypasses.bypass_removed_date IS 'Date and time the bypass was removed.';

COMMENT ON COLUMN sims.application_restriction_bypasses.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.application_restriction_bypasses.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.application_restriction_bypasses.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.application_restriction_bypasses.modifier IS 'Modifier of the record.';