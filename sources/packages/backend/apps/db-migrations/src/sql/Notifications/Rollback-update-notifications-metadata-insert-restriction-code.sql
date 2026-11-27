-- Rollback: Remove restrictionCode from notifications metadata for notification_message_id = 42
UPDATE sims.notifications
SET metadata = metadata - 'restrictionCode'
WHERE notification_message_id = 42
  AND (metadata->>'restrictionCode') = 'SUS';
