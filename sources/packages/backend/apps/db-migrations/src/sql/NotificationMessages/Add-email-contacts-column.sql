ALTER TABLE
  sims.notification_messages
ADD
  COLUMN email_contacts VARCHAR(300) [];

COMMENT ON COLUMN sims.notification_messages.email_contacts IS 'Email addresses to receive a notification when these emails are targeted to someone, not the user, for instance, the Ministry or an external party.';