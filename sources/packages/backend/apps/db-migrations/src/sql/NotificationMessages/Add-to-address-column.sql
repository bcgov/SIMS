ALTER TABLE
  sims.notification_messages
ADD
  COLUMN to_address VARCHAR(300) [];

COMMENT ON COLUMN sims.notification_messages.to_address IS 'Addresses who receive notification email.';