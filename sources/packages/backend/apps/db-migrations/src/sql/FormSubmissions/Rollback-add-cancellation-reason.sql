-- Rollback all the form submission which were not assessed to pending status.
UPDATE
    sims.form_submissions
SET
    submission_status = 'Pending',
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
    submission_status = 'Cancelled'
    AND cancellation_reason IN ('Application cancelled', 'Application edited')
    AND assessed_date IS NULL;

-- Rollback all the form submission which were assessed with at least one approved decision to completed status.
UPDATE
    sims.form_submissions
SET
    submission_status = 'Completed',
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
    submission_status = 'Cancelled'
    AND cancellation_reason IN ('Application cancelled', 'Application edited')
    AND assessed_date IS NOT NULL
    AND EXISTS (
        SELECT
            1
        FROM
            sims.form_submission_items submission_item
            INNER JOIN sims.form_submission_item_decisions decision ON submission_item.current_decision_id = decision.id
        WHERE
            submission_item.form_submission_id = form_submissions.id
            AND decision.decision_status = 'Approved'
    );

-- Rollback all the form submission which were assessed with no approved decision to declined status.
UPDATE
    sims.form_submissions
SET
    submission_status = 'Declined',
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
    submission_status = 'Cancelled'
    AND cancellation_reason IN ('Application cancelled', 'Application edited')
    AND assessed_date IS NOT NULL
    AND NOT EXISTS (
        SELECT
            1
        FROM
            sims.form_submission_items submission_item
            INNER JOIN sims.form_submission_item_decisions decision ON submission_item.current_decision_id = decision.id
        WHERE
            submission_item.form_submission_id = form_submissions.id
            AND decision.decision_status = 'Approved'
    );

ALTER TABLE
    sims.form_submissions DROP COLUMN cancellation_reason;