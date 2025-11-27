/**
 * Drop the table sims.institution_restrictions to allow it to be recreated
 * as it was before the changes made to allow repurposing restrictions.
 */
DROP TABLE sims.institution_restrictions;

-- Create Table sims.institution_restrictions as in the original script.
CREATE TABLE sims.institution_restrictions(
    id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES sims.institutions(id),
    restriction_id INT NOT NULL REFERENCES sims.restrictions(id),
    restriction_note_id INT REFERENCES sims.notes(id),
    resolution_note_id INT REFERENCES sims.notes(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Audit columns
    created_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp WITH time zone NOT NULL DEFAULT NOW(),
    creator INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL,
        modifier INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
    SET
        NULL
);

-- Comments for table and column.
COMMENT ON TABLE sims.institution_restrictions IS 'Table that has restriction details for an institution.';

COMMENT ON COLUMN sims.institution_restrictions.id IS 'Auto-generated sequential primary key column.';

COMMENT ON COLUMN sims.institution_restrictions.institution_id IS 'Foreign key reference to institutions table.';

COMMENT ON COLUMN sims.institution_restrictions.restriction_id IS 'Foreign key reference to restrictions table.';

COMMENT ON COLUMN sims.institution_restrictions.restriction_note_id IS 'Note added during restriction creation.';

COMMENT ON COLUMN sims.institution_restrictions.resolution_note_id IS 'Note added during restriction resolution.';

COMMENT ON COLUMN sims.institution_restrictions.is_active IS 'Value which decides if a institution restriction is active or not.';

COMMENT ON COLUMN sims.institution_restrictions.created_at IS 'Record creation timestamp.';

COMMENT ON COLUMN sims.institution_restrictions.updated_at IS 'Record update timestamp.';

COMMENT ON COLUMN sims.institution_restrictions.creator IS 'Creator of the record. Null specifies the record is created by system.';

COMMENT ON COLUMN sims.institution_restrictions.modifier IS 'Modifier of the record. Null specifies the record is modified by system.';