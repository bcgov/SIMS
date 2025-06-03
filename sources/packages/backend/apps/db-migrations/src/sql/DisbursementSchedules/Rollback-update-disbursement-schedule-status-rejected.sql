update
    sims.disbursement_schedules
set
    disbursement_schedule_status = 'Cancelled',
    disbursement_schedule_status_updated_by = NULL,
    disbursement_schedule_status_updated_on = NULL
where
    disbursement_schedule_status = 'Rejected'
    AND date_sent IS NOT NULL;