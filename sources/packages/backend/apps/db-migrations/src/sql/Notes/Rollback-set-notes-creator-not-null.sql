-- Rollback the creator field to allow NULLs again.
-- Drop the NOT NULL constraint that uses ON DELETE RESTRICT.
ALTER TABLE
    sims.notes DROP CONSTRAINT IF EXISTS notes_creator_fkey;

-- Alter the creator column to allow NULLs.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator DROP NOT NULL;

-- Recreate the original foreign key with ON DELETE SET NULL behavior.
ALTER TABLE
    sims.notes
ADD
    CONSTRAINT notes_creator_fkey FOREIGN KEY (creator) REFERENCES sims.users (id) ON
DELETE
SET
    NULL;