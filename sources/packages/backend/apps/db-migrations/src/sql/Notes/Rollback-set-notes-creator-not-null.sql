-- Rollback the creator field to allow NULLs again.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator DROP NOT NULL;

-- Restore the original foreign key behavior on creator with ON DELETE SET NULL.
ALTER TABLE
    sims.notes
DROP CONSTRAINT IF EXISTS fk_notes_creator;

ALTER TABLE
    sims.notes
ADD CONSTRAINT fk_notes_creator
FOREIGN KEY (creator)
REFERENCES sims.users(id)
ON DELETE SET NULL;