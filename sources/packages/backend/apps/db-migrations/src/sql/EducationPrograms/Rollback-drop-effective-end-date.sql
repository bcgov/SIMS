-- Add effective_end_date back to education_programs and education_programs_history tables.
-- Both tables must be changed together to keep the columns aligned for the history trigger.
ALTER TABLE sims.education_programs
ADD COLUMN effective_end_date DATE;

COMMENT ON COLUMN sims.education_programs.effective_end_date IS 'Effective End date added by minsitry user, when a minsitry user approve a pending program.';

ALTER TABLE sims.education_programs_history
ADD COLUMN effective_end_date DATE;

COMMENT ON COLUMN sims.education_programs_history.effective_end_date IS 'Historical data from the original table. See original table comments for details.';

-- Restore the effective_end_date values from the backup column.
-- Disable the history trigger to avoid creating history entries for the restore.
ALTER TABLE sims.education_programs DISABLE TRIGGER education_programs_history_trigger;

UPDATE sims.education_programs
SET
  effective_end_date = effective_end_date_before_removal
WHERE
  effective_end_date_before_removal IS NOT NULL;

ALTER TABLE sims.education_programs ENABLE TRIGGER education_programs_history_trigger;

UPDATE sims.education_programs_history
SET
  effective_end_date = effective_end_date_before_removal
WHERE
  effective_end_date_before_removal IS NOT NULL;

-- Reactivate the programs deactivated due to an expired effective end date,
-- only when the is_active was not changed since the deactivation (last updated by the system user).
-- History trigger intentionally kept enabled to audit the change.
UPDATE sims.education_programs
SET
  is_active = TRUE,
  is_active_updated_by = NULL,
  is_active_updated_on = NULL,
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
  is_active = FALSE
  AND deactivated_on_removal = TRUE
  AND is_active_updated_by = (
    SELECT
      id
    FROM
      sims.users
    WHERE
      -- System user.
      user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
  );

-- Drop the backup columns from education_programs and education_programs_history tables.
ALTER TABLE sims.education_programs
DROP COLUMN effective_end_date_before_removal,
DROP COLUMN deactivated_on_removal;

ALTER TABLE sims.education_programs_history
DROP COLUMN effective_end_date_before_removal,
DROP COLUMN deactivated_on_removal;