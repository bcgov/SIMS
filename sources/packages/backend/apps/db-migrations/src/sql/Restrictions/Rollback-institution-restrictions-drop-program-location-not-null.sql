ALTER TABLE
    sims.institution_restrictions
ALTER COLUMN
    location_id
SET
    NOT NULL,
ALTER COLUMN
    program_id
SET
    NOT NULL;

-- Remove the and re-create the unique index without the NULL value consideration.
DROP INDEX sims.institution_id_location_id_program_id_restriction_id_is_active_unique;

CREATE UNIQUE INDEX institution_id_location_id_program_id_restriction_id_is_active_unique ON sims.institution_restrictions (
    institution_id,
    location_id,
    program_id,
    restriction_id
)
WHERE
    is_active = TRUE;

COMMENT ON INDEX sims.institution_id_location_id_program_id_restriction_id_is_active_unique IS 'Ensures only one active restriction per institution, location, program, and restriction combination for active restrictions.';