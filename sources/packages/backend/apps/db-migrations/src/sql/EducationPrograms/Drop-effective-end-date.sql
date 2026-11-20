-- Add effective_end_date_before_removal to education_programs and education_programs_history tables
-- to keep the current effective_end_date values for rollback purposes.
-- Add deactivated_on_removal to education_programs and education_programs_history tables
-- to identify, during rollback, the programs deactivated due to an expired effective end date.
-- Both tables must be changed together to keep the columns aligned for the history trigger.
ALTER TABLE sims.education_programs
ADD COLUMN effective_end_date_before_removal DATE,
ADD COLUMN deactivated_on_removal BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sims.education_programs.effective_end_date_before_removal IS 'Column created to store the effective end date before the column removal, for rollback.';

COMMENT ON COLUMN sims.education_programs.deactivated_on_removal IS 'Indicates the program was deactivated due to an expired effective end date during the effective end date removal and must be reactivated on rollback.';

ALTER TABLE sims.education_programs_history
ADD COLUMN effective_end_date_before_removal DATE,
ADD COLUMN deactivated_on_removal BOOLEAN;

COMMENT ON COLUMN sims.education_programs_history.effective_end_date_before_removal IS 'Historical data from the original table. See original table comments for details.';

COMMENT ON COLUMN sims.education_programs_history.deactivated_on_removal IS 'Historical data from the original table. See original table comments for details.';

-- Deactivate the active programs with an expired effective end date.
-- History trigger intentionally kept enabled to audit the change.
UPDATE sims.education_programs
SET
  is_active = FALSE,
  is_active_updated_by = (
    SELECT
      id
    FROM
      sims.users
    WHERE
      -- System user.
      user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
  ),
  is_active_updated_on = NOW(),
  deactivated_on_removal = TRUE,
  updated_at = NOW(),
  modifier = (
    SELECT
      id
    FROM
      sims.users
    WHERE
      -- System user.
      user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
  )
WHERE
  is_active = TRUE
  AND effective_end_date < CURRENT_DATE;

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