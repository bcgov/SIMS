-- Users Table
CREATE TABLE IF NOT EXISTS users ( 
  id SERIAL PRIMARY KEY,
  user_name VARCHAR(300) NOT NULL UNIQUE,
  email VARCHAR(300) NOT NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()
);

-- Indices
-- # id index
CREATE INDEX IF NOT EXISTS idx_users_id_20210115_5_00 ON users (id);
-- # user name
CREATE INDEX IF NOT EXISTS idx_users_name_20210115_5_01 ON users (user_name);
-- # first name
CREATE INDEX IF NOT EXISTS idx_users_display_name_20210127_14_02 ON users (first_name,last_name);

-- ## Comments
COMMENT ON TABLE users IS 'User of the application is a person with valid authrorization via BCSC (student) / IDIR (SABC employee) / BCeID (educational institution)';
COMMENT ON COLUMN users.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN users.user_name IS 'Unique user name obtained from identity provider';
COMMENT ON COLUMN users.email IS 'Unique email address associated with user';
COMMENT ON COLUMN users.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Record update timestamp';
