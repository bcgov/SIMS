-- Set the creator column to NOT NULL for the notes table.
-- Based on code analysis, all places that save notes properly set the creator field.
-- This migration ensures data integrity by enforcing the creator field at the database level.
-- If there are any notes with NULL creator (which should not exist based on code analysis),
-- this migration will fail and requires manual intervention to fix the data first.
-- Alter the creator field to NOT NULL.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator
SET
    NOT NULL;