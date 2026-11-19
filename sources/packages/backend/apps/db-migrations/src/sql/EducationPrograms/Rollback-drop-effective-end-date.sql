-- Add effective_end_date back to education_programs and education_programs_history tables.
-- Both tables must be changed together to keep the columns aligned for the history trigger.
ALTER TABLE
  sims.education_programs
ADD
  COLUMN effective_end_date DATE;

COMMENT ON COLUMN sims.education_programs.effective_end_date IS 'Effective End date added by minsitry user, when a minsitry user approve a pending program.';

ALTER TABLE
  sims.education_programs_history
ADD
  COLUMN effective_end_date DATE;

COMMENT ON COLUMN sims.education_programs_history.effective_end_date IS 'Historical data from the original table. See original table comments for details.';

-- Restore the effective_end_date values from the backup column.
UPDATE
  sims.education_programs_history
SET
  effective_end_date = effective_end_date_before_removal
WHERE
  effective_end_date_before_removal IS NOT NULL;

UPDATE
  sims.education_programs
SET
  effective_end_date = effective_end_date_before_removal
WHERE
  effective_end_date_before_removal IS NOT NULL;

-- Drop the backup column from education_programs and education_programs_history tables.
ALTER TABLE
  sims.education_programs DROP COLUMN effective_end_date_before_removal;

ALTER TABLE
  sims.education_programs_history DROP COLUMN effective_end_date_before_removal;
