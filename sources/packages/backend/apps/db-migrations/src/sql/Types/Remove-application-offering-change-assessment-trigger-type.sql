-- Postgres does not allow the removal of items of an enum, only add or rename.
-- To remove the previously added items, a temporary enum will be created to
-- allow the creation of the enum as it was before.
CREATE TYPE sims.assessment_trigger_types_to_rollback AS ENUM (
  'Original assessment',
  'Scholastic standing change',
  'Program change',
  'Offering change',
  'Student appeal'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.student_assessments
ALTER COLUMN
  trigger_type TYPE sims.assessment_trigger_types_to_rollback USING (
    CASE
      trigger_type :: text
      WHEN 'Application offering change' THEN 'Offering change'
      ELSE trigger_type :: text
    END
  ) :: sims.assessment_trigger_types_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.assessment_trigger_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.assessment_trigger_types_to_rollback RENAME TO assessment_trigger_types;