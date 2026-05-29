CREATE TABLE sims.student_disability_profiles(
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES sims.students(id) NOT NULL,
  disability_profile_status sims.disability_profile_status NOT NULL,
  completed_by INT REFERENCES sims.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- Audit columns.
  deleted_at TIMESTAMP WITH TIME ZONE CHECK (
    deleted_at IS NULL
    OR disability_profile_status = 'Draft' :: sims.disability_profile_status
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT DEFAULT NULL REFERENCES sims.users(id),
  -- Ensures completed_by and completed_at are populated once the profile leaves Draft status.
  CONSTRAINT completed_required_when_not_draft CHECK (
    disability_profile_status = 'Draft' :: sims.disability_profile_status
    OR (
      completed_by IS NOT NULL
      AND completed_at IS NOT NULL
    )
  )
);

-- Ensures only one non-deleted draft disability profile exists per student at a time.
CREATE UNIQUE INDEX student_disability_profiles_unique_draft_per_student ON sims.student_disability_profiles(student_id)
WHERE
  disability_profile_status = 'Draft'
  AND deleted_at IS NULL;

-- Ensures only one active disability profile exists per student at a time.
CREATE UNIQUE INDEX student_disability_profiles_unique_active_per_student ON sims.student_disability_profiles(student_id)
WHERE
  disability_profile_status = 'Active';

COMMENT ON TABLE sims.student_disability_profiles IS 'Disability profiles, current and historical. Each profile can have multiple disabilities.';

COMMENT ON COLUMN sims.student_disability_profiles.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_disability_profiles.student_id IS 'Student associated with this disability profile.';

COMMENT ON COLUMN sims.student_disability_profiles.disability_profile_status IS 'Current lifecycle status of the disability profile.';

COMMENT ON COLUMN sims.student_disability_profiles.completed_by IS 'User who completed the profile.';

COMMENT ON COLUMN sims.student_disability_profiles.completed_at IS 'Timestamp when the profile was completed.';

COMMENT ON COLUMN sims.student_disability_profiles.deleted_at IS 'Timestamp when the profile was soft-deleted. Can only be set while the profile is in Draft status.';

COMMENT ON COLUMN sims.student_disability_profiles.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_disability_profiles.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_disability_profiles.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.student_disability_profiles.modifier IS 'Modifier of the record.';

COMMENT ON INDEX sims.student_disability_profiles_unique_active_per_student IS 'Enforces that only one active disability profile can exist for a student at any given time.';

COMMENT ON INDEX sims.student_disability_profiles_unique_draft_per_student IS 'Enforces that only one non-deleted draft disability profile can exist for a student at any given time.';