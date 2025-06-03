UPDATE
    sims.disbursement_schedules
SET
    disbursement_schedule_status = 'Rejected',
    disbursement_schedule_status_updated_by = (
        SELECT
            id
        FROM
            sims.users
        WHERE
            -- System user.
            user_name = '8fb44f70-6ce6-11ed-b307-8743a2da47ef@system'
    ),
    disbursement_schedule_status_updated_on = now()
WHERE
    disbursement_schedule_status = 'Cancelled'
    AND date_sent IS NOT NULL;