-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.program_info_status_to_rollback AS ENUM ('required', 'not required', 'completed');

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.applications
ALTER COLUMN
  pir_status TYPE sims.program_info_status_to_rollback USING CASE
    WHEN pir_status = 'Required' THEN 'required' :: sims.program_info_status_to_rollback
    WHEN pir_status = 'Not Required' THEN 'not required' :: sims.program_info_status_to_rollback
    WHEN pir_status = 'Completed' THEN 'completed' :: sims.program_info_status_to_rollback
    WHEN pir_status = 'Submitted' THEN 'completed' :: sims.program_info_status_to_rollback
    WHEN pir_status = 'Declined' THEN 'completed' :: sims.program_info_status_to_rollback
  END;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.program_info_status;

-- Rename the enum to what it was in the begining.
ALTER TYPE sims.program_info_status_to_rollback RENAME TO program_info_status;