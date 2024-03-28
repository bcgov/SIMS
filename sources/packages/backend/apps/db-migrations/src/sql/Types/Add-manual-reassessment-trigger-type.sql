-- Postgres allows adding new types to an enum but it causes issues when the new types added are
-- used in another query in the same transaction, hence the team decision was to recreate the enums
-- types when a new item must be added following the same approach already used for rollbacks.
CREATE TYPE sims.assessment_trigger_types_to_be_updated AS ENUM (
  'Original assessment',
  'Scholastic standing change',
  'Program change',
  'Offering change',
  'Student appeal',
  'Application offering change',
  'Related application changed',
  'Manual reassessment'
);

-- Update the dependent column to start using the new enum with the expected values.
ALTER TABLE
  sims.student_assessments
ALTER COLUMN
  trigger_type TYPE sims.assessment_trigger_types_to_be_updated USING (trigger_type :: text) :: sims.assessment_trigger_types_to_be_updated;

-- Remove the entire enum that is no longer being used.
DROP TYPE sims.assessment_trigger_types;

-- Rename the enum to what it was in the beginning.
ALTER TYPE sims.assessment_trigger_types_to_be_updated RENAME TO assessment_trigger_types;
