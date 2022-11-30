ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS disbursement_schedule_status sims.disbursement_schedule_status DEFAULT 'Pending';