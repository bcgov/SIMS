/*
 Since there is no way to know the records that were affect by the migration we are leaving the creator field as is and only rolling back 
 the alter column to allow nulls.
 */
-- Rollback the creator field to allow NULLs again.
ALTER TABLE
    sims.applications
ALTER COLUMN
    creator_id DROP NOT NULL;