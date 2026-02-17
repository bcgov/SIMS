-- Rollback the creator field to allow NULLs again.
ALTER TABLE
    sims.notes
ALTER COLUMN
    creator DROP NOT NULL;