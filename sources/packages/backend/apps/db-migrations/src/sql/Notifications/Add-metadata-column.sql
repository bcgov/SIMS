ALTER TABLE
  sims.notifications
ADD
  COLUMN metadata jsonb;

COMMENT ON COLUMN sims.notifications.metadata IS 'Metadata information for a notification to allow a more granular identification or identify further the reason why it was generated.';