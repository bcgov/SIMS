-- Add action_type to restrictions table.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS action_type sims.restriction_action_type [] NOT NULL DEFAULT ARRAY ['No effect'] :: sims.restriction_action_type [];

COMMENT ON COLUMN sims.restrictions.action_type IS 'List of enum restriction_action_type, i.e this column contains the list of action types for a restrictions.';

-- Add notification_type to restrictions table.
ALTER TABLE
  sims.restrictions
ADD
  COLUMN IF NOT EXISTS notification_type sims.restriction_notification_type NOT NULL DEFAULT 'No effect';

COMMENT ON COLUMN sims.restrictions.notification_type IS 'The type of notification for a restriction.';