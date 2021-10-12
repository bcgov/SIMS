CREATE TABLE IF NOT EXISTS sims.supporting_users (
  id SERIAL PRIMARY KEY,
  contact_info JSONB,
  sin VARCHAR(9),
  birth_date DATE,
  gender VARCHAR(10),
  supporting_data JSONB,
  supporting_user_type sims.supporting_user_types NOT NULL,
  -- Reference Columns
  user_id INT REFERENCES sims.users(id) ON DELETE CASCADE,
  application_Id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE,
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
  SET
    NULL,
    UNIQUE (application_Id, user_id)
);

-- ## Comments
COMMENT ON TABLE sims.supporting_users IS 'Users that provide supporting information for a Student Application (e.g. parents and partners).';

COMMENT ON COLUMN sims.supporting_users.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.supporting_users.contact_info IS 'Contact information for the supporting user.';

COMMENT ON COLUMN sims.supporting_users.sin IS 'SIN for the supporting user that will be used for CRA inquiries.';

COMMENT ON COLUMN sims.supporting_users.birth_date IS 'Birth date for the supporting user that will be used for CRA inquiries.';

COMMENT ON COLUMN sims.supporting_users.gender IS 'Gender as received from BCSC authentication.';

COMMENT ON COLUMN sims.supporting_users.supporting_data IS 'Dynamic data that will be used alongside the Student Application workflow.';

COMMENT ON COLUMN sims.supporting_users.supporting_user_type IS 'Type of the supporting user (e.g. Parent/Partner).';

COMMENT ON COLUMN sims.supporting_users.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.supporting_users.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.supporting_users.creator IS 'Creator of the record. Null specified the record is created by system.';

COMMENT ON COLUMN sims.supporting_users.modifier IS 'Modifier of the record. Null specified the record is modified by system.';