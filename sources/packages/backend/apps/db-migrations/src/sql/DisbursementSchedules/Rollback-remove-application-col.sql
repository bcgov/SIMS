-- Allow the creation of the NOT NULL column.
DELETE FROM
    sims.disbursement_schedules;

-- Add assessment
ALTER TABLE
    sims.disbursement_schedules
ADD
    COLUMN IF NOT EXISTS application_id INT NOT NULL REFERENCES sims.applications(id) ON DELETE CASCADE;

COMMENT ON COLUMN sims.disbursement_schedules.application_id IS 'Student Application related to the disbursement.';