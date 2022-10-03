/*
 * Removing column application_id that is no longer needed after the
 * DB structure was changed to accommodate the reassessments.
 */
ALTER TABLE
    sims.disbursement_schedules DROP COLUMN IF EXISTS application_id;