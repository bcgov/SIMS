-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.relationship_status_to_rollback AS ENUM ('married', 'single', 'other');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.applications
ALTER COLUMN
  relationship_status TYPE sims.relationship_status_to_rollback USING (
    CASE
      relationship_status :: text
      WHEN 'marriedUnable' THEN 'other'
      ELSE relationship_status :: text
    END
  ) :: sims.relationship_status_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.relationship_status;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.relationship_status_to_rollback RENAME TO relationship_status;