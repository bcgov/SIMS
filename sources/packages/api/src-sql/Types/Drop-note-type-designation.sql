--Removing the value Designation from sims.note_types for the rollback.
--As postgres does not support removal of an Enum Value, We create a temporary enum and rename it.
CREATE TYPE sims.note_types_to_rollback AS ENUM (
    'General',
    'Program',
    'Restriction',
    'System Actions'
);

ALTER TABLE
    sims.notes
ALTER COLUMN
    note_type TYPE sims.note_types_to_rollback USING note_type :: text :: sims.note_types_to_rollback;

DROP TYPE sims.note_types;

ALTER TYPE sims.note_types_to_rollback RENAME TO note_types;