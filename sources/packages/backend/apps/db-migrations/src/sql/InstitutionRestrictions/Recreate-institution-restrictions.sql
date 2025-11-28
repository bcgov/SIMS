/**
 * Recreate institution_restrictions table to allow repurposing restrictions
 * to specific locations and programs within an institution.
 * The DDL scripts were added first to the Restrictions folder and are now
 * being moved to the InstitutionRestrictions folder following the
 * organization strategy to keep table-related scripts together.
 */
DROP TABLE sims.institution_restrictions;

CREATE TABLE sims.institution_restrictions(
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES sims.institutions(id),
    program_id INT NOT NULL REFERENCES sims.education_programs(id),
    location_id INT NOT NULL REFERENCES sims.institution_locations(id),
    restriction_id INT NOT NULL REFERENCES sims.restrictions(id),
    restriction_note_id INT NOT NULL REFERENCES sims.notes(id),
    resolution_note_id INT REFERENCES sims.notes(id),
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    resolved_by INT REFERENCES sims.users(id),
    is_active BOOLEAN NOT NULL,
    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creator INT NOT NULL REFERENCES sims.users(id),
    modifier INT REFERENCES sims.users(id)
);

COMMENT ON TABLE sims.institution_restrictions IS 'Institution-level restrictions.';

COMMENT ON COLUMN sims.institution_restrictions.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.institution_restrictions.institution_id IS 'Institution that owns the restriction.';

COMMENT ON COLUMN sims.institution_restrictions.program_id IS 'Specific program the restriction applies to.';

COMMENT ON COLUMN sims.institution_restrictions.location_id IS 'Specific location the restriction applies to.';

COMMENT ON COLUMN sims.institution_restrictions.restriction_id IS 'Assigned restriction.';

COMMENT ON COLUMN sims.institution_restrictions.restriction_note_id IS 'Note entered during restriction creation.';

COMMENT ON COLUMN sims.institution_restrictions.resolution_note_id IS 'Note entered during restriction resolution.';

COMMENT ON COLUMN sims.institution_restrictions.resolved_at IS 'Date when the restriction was resolved.';

COMMENT ON COLUMN sims.institution_restrictions.resolved_by IS 'User who resolved the restriction.';

COMMENT ON COLUMN sims.institution_restrictions.is_active IS 'Indicates if an institution restriction is active or not.';

COMMENT ON COLUMN sims.institution_restrictions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.institution_restrictions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.institution_restrictions.creator IS 'Creator of the record.';

COMMENT ON COLUMN sims.institution_restrictions.modifier IS 'Modifier of the record.';

CREATE UNIQUE INDEX institution_id_location_id_program_id_restriction_id_is_active_unique ON sims.institution_restrictions (
    institution_id,
    location_id,
    program_id,
    restriction_id
)
WHERE
    is_active = TRUE;

COMMENT ON INDEX institution_id_location_id_program_id_restriction_id_is_active_unique IS 'Ensures only one active restriction per institution, location, program, and restriction combination for active restrictions.';