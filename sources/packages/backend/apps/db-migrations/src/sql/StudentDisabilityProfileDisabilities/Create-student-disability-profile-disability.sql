CREATE TABLE sims.student_disability_profile_disabilities(
  id SERIAL PRIMARY KEY,
  student_disability_profile_id INT REFERENCES sims.student_disability_profiles(id) NOT NULL,
  impairments VARCHAR(100) [] NOT NULL,
  diagnosis VARCHAR(1000) NOT NULL,
  disability_type VARCHAR(100) NOT NULL CHECK (
    sims.is_valid_system_lookup_key(
      disability_type :: TEXT,
      'Disability type' :: TEXT
    )
  ),
  disability_description VARCHAR(255),
  disability_designation VARCHAR(100) NOT NULL CHECK (
    sims.is_valid_system_lookup_key(
      disability_designation :: TEXT,
      'Disability designation' :: TEXT
    )
  ),
  -- Audit columns.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT DEFAULT NULL REFERENCES sims.users(id)
);