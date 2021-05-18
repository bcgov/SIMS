CREATE TABLE IF NOT EXISTS institution_user_type_roles(
  id SERIAL PRIMARY KEY,
  user_type_description VARCHAR(500) NULL,
  user_role_description VARCHAR(500) NULL,
  user_type VARCHAR(100) NOT NULL,
  user_role VARCHAR(100) NULL,
  active_indicator BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,

  -- Constraint
  CONSTRAINT uc_user_type_roles_202105170819 UNIQUE (user_type,user_role)
);

-- Comments
COMMENT ON TABLE institution_user_type_roles IS 'Code table to manage different institution user types defined in system.';

COMMENT ON COLUMN institution_user_type_roles.id IS 'Auto-generated sequential primary key column';

COMMENT ON COLUMN institution_user_type_roles.user_type_description IS 'The business related description of respective user type element';

COMMENT ON COLUMN institution_user_type_roles.user_role_description IS 'The business related description of respective user role element';

COMMENT ON COLUMN institution_user_type_roles.user_type IS 'Unique code to identify each user type. In application this will be represented by string enum';

COMMENT ON COLUMN institution_user_type_roles.user_role IS 'Unique code to identify each user roles. In application this will be represented by string enum';

COMMENT ON COLUMN institution_user_type_roles.active_indicator IS 'Indicator to check active status of code';

COMMENT ON COLUMN institution_user_type_roles.created_at IS 'Record creation timestamp';

COMMENT ON COLUMN institution_user_type_roles.updated_at IS 'Record update timestamp';

COMMENT ON COLUMN institution_user_type_roles.creator IS 'Creator of the record. Null specified the record is created by system';

COMMENT ON COLUMN institution_user_type_roles.modifier IS 'Modifier of the record. Null specified the record is modified by system';