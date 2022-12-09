ALTER TABLE
    sims.notifications
ADD
    COLUMN IF NOT EXISTS permanent_failure_error jsonb;

COMMENT ON COLUMN sims.notifications.permanent_failure_error IS 'Error details of a permanent failure if occurred while processing the notification.';