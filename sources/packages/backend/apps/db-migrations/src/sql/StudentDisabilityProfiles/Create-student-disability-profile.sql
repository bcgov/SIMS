CREATE TABLE student_disability_profiles(
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES sims.students(id) NOT NULL,
  disability_profile_status sims.disability_profile_status NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE CHECK (
    deleted_at IS NULL
    OR disability_profile_status = 'Draft' :: sims.disability_profile_status
  ),
  -- Audit columns.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT DEFAULT NULL REFERENCES sims.users(id)
);

COMMENT ON TABLE sims.student_disability_profiles IS 'Disability profiles, current and historical. Each profile can have multiple disabilities.';

COMMENT ON COLUMN sims.student_disability_profiles.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_disability_profiles.student_id IS 'Student associated with this disability profile.';

COMMENT ON COLUMN sims.student_disability_profiles.disability_profile_status IS 'Current lifecycle status of the disability profile.';

COMMENT ON COLUMN sims.student_disability_profiles.deleted_at IS 'Timestamp when the profile was soft-deleted. Can only be set while the profile is in Draft status.';

COMMENT ON COLUMN sims.student_disability_profiles.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_disability_profiles.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_disability_profiles.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.student_disability_profiles.modifier IS 'Modifier of the record.';