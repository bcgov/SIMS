-- Set the creator column to NOT NULL for the notes table.
-- Based on code analysis, all places that save notes properly set the creator field.
-- This migration ensures data integrity by enforcing the creator field at the database level.
-- If there are any notes with NULL creator (which should not exist based on code analysis),
-- this migration will fail and requires manual intervention to fix the data first.
-- Before enforcing NOT NULL, update the foreign key so it no longer uses ON DELETE SET NULL.
ALTER TABLE
    sims.notes
DROP CONSTRAINT IF EXISTS
    notes_creator_fkey;

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
ADD CONSTRAINT
    notes_creator_fkey
FOREIGN KEY
    (creator)
REFERENCES
    users (id)
ON DELETE RESTRICT;