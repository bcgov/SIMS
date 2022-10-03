-- Institution user table
CREATE TABLE IF NOT EXISTS institution_users(
  id SERIAL PRIMARY KEY,

  -- Relations
  user_id INT NULL,
  institution_id INT NOT NULL,

  -- Foreign keys
  -- #user id
  CONSTRAINT fk_institution_user_id_202105180001 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  -- #institution id
  CONSTRAINT fk_institution_id_202105180002 FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);



-- Comments
COMMENT ON TABLE institution_users IS 'Table to store reference for all user related to institution entity';

COMMENT ON COLUMN institution_users.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN institution_users.user_id IS 'Foreign key referential colum to users table';
COMMENT ON COLUMN institution_users.institution_id IS 'Foreign key referential colum to institution table';
COMMENT ON COLUMN institution_users.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN institution_users.updated_at IS 'Record update timestamp';
COMMENT ON COLUMN institution_users.creator IS 'Creator of the record. Null specified the record is created by system';
COMMENT ON COLUMN institution_users.modifier IS 'Modifier of the record. Null specified the record is modified by system';
