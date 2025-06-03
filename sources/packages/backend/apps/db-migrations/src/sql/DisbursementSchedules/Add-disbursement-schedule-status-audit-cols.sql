ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN disbursement_schedule_status_updated_by INT REFERENCES sims.users(id),
ADD
    COLUMN disbursement_schedule_status_updated_on TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.disbursement_schedules.disbursement_schedule_status_updated_by IS 'User who updated the disbursement schedule status.';

COMMENT ON COLUMN sims.disbursement_schedules.disbursement_schedule_status_updated_on IS 'Date and time when the disbursement schedule status was updated.';