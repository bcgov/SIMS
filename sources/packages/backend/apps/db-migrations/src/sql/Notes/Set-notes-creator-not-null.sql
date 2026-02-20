-- Set the creator column to NOT NULL for the notes table.
-- This migration ensures data integrity by enforcing the creator field at the database level.
-- First, update any NULL creator values to the system user.
-- These are typically system-generated notes like partial match restriction notes.
UPDATE
    sims.notes
SET
    creator = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system' -- Hardcoded system user name.
    )
WHERE
    creator IS NULL;

-- Drop the existing foreign key constraint.
ALTER TABLE
    sims.notes DROP CONSTRAINT notes_creator_fkey;

-- Alter the creator field to NOT NULL.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator
SET
    NOT NULL;

-- Recreate the foreign key.
ALTER TABLE
    sims.notes
ADD
    CONSTRAINT notes_creator_fkey FOREIGN KEY (creator) REFERENCES sims.users (id)