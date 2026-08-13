-- Rollback the submission_status of the form_submissions which were updated during migration
-- using submission_status_before_update column.
UPDATE
    sims.form_submissions
SET
    submission_status = submission_status_before_update,
    submission_status_updated_by = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    submission_status_updated_on = NOW()
WHERE
    submission_status_before_update IS NOT NULL;

ALTER TABLE
    sims.form_submissions DROP COLUMN cancellation_reason,
    DROP COLUMN submission_status_before_update;