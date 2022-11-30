ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS disbursement_schedule_status sims.disbursement_schedule_status NOT NULL DEFAULT 'Pending';

COMMENT ON COLUMN sims.disbursement_schedules.disbursement_schedule_status IS 'Indicates if the money amount information was already sent to be paid to the student.';