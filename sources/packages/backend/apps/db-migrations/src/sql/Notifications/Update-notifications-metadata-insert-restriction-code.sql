-- Update notifications metadata to add restriction code for institution restrictions blocking assessment notification.
UPDATE sims.notifications
SET metadata = jsonb_set(
  metadata,
  '{restrictionCode}',
  to_jsonb('SUS'::text)
)
WHERE notification_message_id = 42;