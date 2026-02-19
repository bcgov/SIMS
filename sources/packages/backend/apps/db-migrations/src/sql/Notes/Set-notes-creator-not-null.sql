-- Set the creator column to NOT NULL for the notes table.
-- This migration ensures data integrity by enforcing the creator field at the database level.
ALTER TABLE
    sims.notes DROP CONSTRAINT notes_creator_fkey;

-- Alter the creator field to NOT NULL.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator
SET
    NOT NULL;

-- Recreate the foreign key with an ON DELETE behavior compatible with NOT NULL.
ALTER TABLE
    sims.notes
ADD
    CONSTRAINT notes_creator_fkey FOREIGN KEY (creator) REFERENCES sims.users (id);