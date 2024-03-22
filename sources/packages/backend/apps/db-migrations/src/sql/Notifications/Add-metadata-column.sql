ALTER TABLE
  sims.notifications
ADD
  COLUMN metadata jsonb;

COMMENT ON COLUMN sims.notifications.metadata IS 'Metadata information on notifications sent such as tracking the various relations associated with the sent notification.';