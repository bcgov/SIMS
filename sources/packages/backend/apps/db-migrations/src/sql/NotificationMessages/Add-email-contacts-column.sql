ALTER TABLE
  sims.notification_messages
ADD
  COLUMN email_contacts VARCHAR(300) [];

COMMENT ON COLUMN sims.notification_messages.email_contacts IS 'Addresses who receive notification email.';