-- Add effective_end_date_before_removal to education_programs and education_programs_history tables
-- to keep the current effective_end_date values for rollback purposes.
-- Both tables must be changed together to keep the columns aligned for the history trigger.
ALTER TABLE sims.education_programs
ADD COLUMN effective_end_date_before_removal DATE;

COMMENT ON COLUMN sims.education_programs.effective_end_date_before_removal IS 'Column created to store the effective end date before the column removal, for rollback.';

ALTER TABLE sims.education_programs_history
ADD COLUMN effective_end_date_before_removal DATE;

COMMENT ON COLUMN sims.education_programs_history.effective_end_date_before_removal IS 'Historical data from the original table. See original table comments for details.';

-- Disable the history trigger to avoid creating history entries for the backfill.
ALTER TABLE sims.education_programs DISABLE TRIGGER education_programs_history_trigger;

UPDATE sims.education_programs
SET
  effective_end_date_before_removal = effective_end_date
WHERE
  effective_end_date IS NOT NULL;

ALTER TABLE sims.education_programs ENABLE TRIGGER education_programs_history_trigger;

UPDATE sims.education_programs_history
SET
  effective_end_date_before_removal = effective_end_date
WHERE
  effective_end_date IS NOT NULL;

-- Drop effective_end_date from education_programs and education_programs_history tables.
ALTER TABLE sims.education_programs
DROP COLUMN effective_end_date;

ALTER TABLE sims.education_programs_history
DROP COLUMN effective_end_date;