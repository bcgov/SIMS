ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS disbursement_schedule_status VARCHAR(50) NOT NULL DEFAULT 'Pending';