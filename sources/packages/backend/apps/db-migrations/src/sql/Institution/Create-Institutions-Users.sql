CREATE TABLE IF NOT EXISTS institutions_users(
  id SERIAL PRIMARY KEY, 
  -- Reference Columns
  institution_id INT REFERENCES institutions(id) ON DELETE CASCADE,    
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ## Comments
COMMENT ON TABLE institutions_users IS 'This is a pivot table to capture the relationship between users table and institutions table';
COMMENT ON COLUMN institutions_users.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN institutions_users.user_id IS 'Foreign key reference to users table users';
COMMENT ON COLUMN institutions_users.institution_id IS 'Foreign key reference to users table institutions';  
