-- Create Table
CREATE TABLE IF NOT EXISTS institution_user_auth(
  id SERIAL PRIMARY KEY,

  -- Ref columns
  institution_user_id INT NOT NULL,
  institution_location_id INT NULL,
  institution_user_type_role_id INT NOT NULL,

  -- Foreign Constraints
  -- #institution_user_id
  CONSTRAINT fk_institution_user_auth_user_id_202105180040 FOREIGN KEY (institution_user_id) REFERENCES institution_users(id) ON DELETE CASCADE,
  -- #institution_location_id
  CONSTRAINT fk_institution_user_auth_location_id_202105180045 FOREIGN KEY (institution_location_id) REFERENCES institution_locations(id) ON DELETE CASCADE,

  -- #institution_user_type_role_id
  CONSTRAINT fk_institution_user_auth_type_role_202105180050 FOREIGN KEY (institution_user_type_role_id) REFERENCES institution_user_type_roles(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE institution_user_auth IS 'Relation table to combine institution user and location with specific user type and roles';

-- COMMENT ON COLUMN institution_user_auth.id IS '';
COMMENT ON COLUMN institution_user_auth.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN institution_user_auth.institution_user_id IS 'Foreign key referential colum to institution_users table';

COMMENT ON COLUMN institution_user_auth.institution_location_id IS 'Foreign key referential colum to institution_locations table';

COMMENT ON COLUMN institution_user_auth.institution_user_type_role_id IS 'Foreign key referential colum to institution_user_type_roles table';

COMMENT ON COLUMN institution_user_auth.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN institution_user_auth.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN institution_user_auth.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN institution_user_auth.modifier IS 'Modifier of the record. Null specified the record is modified by system';
