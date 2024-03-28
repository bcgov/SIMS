--As postgres does not support removal of an Enum Value, we create a temporary enum and rename it.
CREATE TYPE sims.assessment_trigger_types_to_rollback AS ENUM (
  'Original assessment',
  'Scholastic standing change',
  'Program change',
  'Offering change',
  'Student appeal',
  'Application offering change',
  'Related application changed'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.student_assessments
ALTER COLUMN
  trigger_type TYPE sims.assessment_trigger_types_to_rollback USING (
    CASE
      trigger_type :: text
      WHEN 'Manual reassessment' THEN 'Offering change'
      ELSE trigger_type :: text
    END
  ) :: sims.assessment_trigger_types_to_rollback;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.assessment_trigger_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.assessment_trigger_types_to_rollback RENAME TO assessment_trigger_types;
