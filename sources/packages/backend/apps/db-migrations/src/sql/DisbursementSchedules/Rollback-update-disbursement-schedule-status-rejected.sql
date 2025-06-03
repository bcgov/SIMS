UPDATE
    sims.disbursement_schedules
SET
    disbursement_schedule_status = 'Cancelled',
    disbursement_schedule_status_updated_by = NULL,
    disbursement_schedule_status_updated_on = NULL
WHERE
    disbursement_schedule_status = 'Rejected'
    AND date_sent IS NOT NULL;