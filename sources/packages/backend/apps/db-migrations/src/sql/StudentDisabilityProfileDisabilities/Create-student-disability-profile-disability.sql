CREATE TABLE sims.student_disability_profile_disabilities(
  id SERIAL PRIMARY KEY,
  student_disability_profile_id INT REFERENCES sims.student_disability_profiles(id) NOT NULL,
  disability_priority SMALLINT NOT NULL,
  disability_category VARCHAR(100) NOT NULL CHECK (
    sims.is_valid_system_lookup_key(
      disability_category :: TEXT,
      'Disability category' :: TEXT
    )
  ),
  disability_type VARCHAR(100) NOT NULL CHECK (
    sims.is_valid_system_lookup_key(
      disability_type :: TEXT,
      'Disability type' :: TEXT
    )
  ),
  disability_notes VARCHAR(255) CHECK (
    disability_type != 'OTHER'
    OR disability_notes IS NOT NULL
  ),
  diagnosis varchar(100) [] NOT NULL,
  diagnosis_notes VARCHAR(1000),
  impairments VARCHAR(100) [] NOT NULL,
  impairments_notes VARCHAR(1000),
  final_notes VARCHAR(1000),
  -- Audit columns.
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  creator INT NOT NULL REFERENCES sims.users(id),
  modifier INT DEFAULT NULL REFERENCES sims.users(id)
);

CREATE UNIQUE INDEX student_disability_profile_id_disability_priority_unique ON sims.student_disability_profile_disabilities (
  student_disability_profile_id,
  disability_priority
)
WHERE
  deleted_at IS NULL;

COMMENT ON TABLE sims.student_disability_profile_disabilities IS 'Individual disability entries associated with a student disability profile.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.student_disability_profile_id IS 'Disability profile this disability entry belongs to.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.disability_priority IS 'Order of the disability within the profile, where 1 indicates the primary disability and higher values indicate additional disabilities.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.disability_category IS 'Category of the disability, validated against the system lookup configuration for disability category.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.disability_type IS 'Type of the disability, validated against the system lookup configuration for disability type.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.disability_notes IS 'Additional notes describing the disability. Required when disability type is OTHER.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.impairments IS 'List of functional impairments associated with this disability. The available list of impairments is stored in the system lookup configuration for disability impairments.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.impairments_notes IS 'Additional notes related to the listed impairments. Full list of available impairments is stored in the system lookup configuration for disability impairments.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.diagnosis IS 'Primary diagnosis information for this disability.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.diagnosis_notes IS 'Additional notes related to the diagnosis.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.final_notes IS 'Any additional notes relevant to this disability entry.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.deleted_at IS 'Timestamp when the disability entry was soft-deleted. Intended to be used only when a draft disability profile is being updated.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.student_disability_profile_disabilities.modifier IS 'Modifier of the record.';

COMMENT ON INDEX sims.student_disability_profile_id_disability_priority_unique IS 'Ensures each disability priority value is unique within a given disability profile only for active (non-deleted) records. The primary disability must have a priority of 1, and any additional disabilities must have incrementing priority values (e.g. 2, 3, etc.) without gaps.';