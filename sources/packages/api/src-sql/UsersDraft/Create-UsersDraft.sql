-- User Draft Table
CREATE TABLE IF NOT EXISTS users_draft (
  id SERIAL PRIMARY KEY,
  -- Reference column
  user_name VARCHAR(300) NOT NULL UNIQUE REFERENCES users(user_name) ON DELETE CASCADE,
  -- Data
  data JSONB NOT NULL,

  -- Form path
  form_path VARCHAR(100) NOT NULL,

  -- Audit timestamp
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now()

);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_draft_name_20210409_8_30 ON users_draft(user_name);

-- Comments
COMMENT ON TABLE users_draft IS 'A common table to store all forms draft per user. The data in the table is not validated and forms.io compatible';
COMMENT ON COLUMN users_draft.id IS 'Auto-generated sequential primary key column';
COMMENT ON COLUMN users_draft.user_name IS 'Reference column to user table through user name';
COMMENT ON COLUMN users_draft.data IS 'Draft form data in jsonb structure';
COMMENT ON COLUMN users_draft.form_path IS 'The identifier for form';
COMMENT ON COLUMN users_draft.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN users_draft.updated_at IS 'Record update timestamp';