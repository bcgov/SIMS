CREATE TABLE IF NOT EXISTS applications (
  id SERIAL PRIMARY KEY,
  data jsonb NOT NULL,

  -- Reference Columns
  student_id INT REFERENCES students(id) ON DELETE CASCADE,

  -- Audit columns
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  creator INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
  modifier INT NULL DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL
);