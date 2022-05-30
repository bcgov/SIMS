-- Remove pending and declined from scholastic_standing_status.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.scholastic_standing_status_rollback AS ENUM ('Approved');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.student_scholastic_standings
ALTER COLUMN
  scholastic_standing_status TYPE sims.scholastic_standing_status_rollback USING scholastic_standing_status :: text :: sims.scholastic_standing_status_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.scholastic_standing_status;

-- Rename the enum to what it was in the begining.
ALTER TYPE sims.scholastic_standing_status_rollback RENAME TO scholastic_standing_status;