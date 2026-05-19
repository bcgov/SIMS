CREATE TABLE student_disability_profiles(
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES sims.students(id) NOT NULL,
  disability_profile_status sims.disability_profile_status NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  -- Audit columns.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT DEFAULT NULL REFERENCES sims.users(id)
);