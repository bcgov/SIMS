--Removing the value Application from sims.note_types for the rollback.
--As postgres does not support removal of an Enum Value, We create a temporary enum and rename it.
CREATE TYPE sims.note_types_to_rollback AS ENUM (
    'General',
    'Program',
    'Restriction',
    'Designation',
    'System Actions'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
    sims.notes
ALTER COLUMN
    note_type TYPE sims.note_types_to_rollback USING (
        CASE
            note_type :: text
            WHEN 'Application' THEN 'General'
            ELSE note_type :: text
        END
    ) :: sims.note_types_to_rollback;

DROP TYPE sims.note_types;

ALTER TYPE sims.note_types_to_rollback RENAME TO note_types;