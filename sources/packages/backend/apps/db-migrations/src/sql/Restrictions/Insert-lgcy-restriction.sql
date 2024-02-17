-- Insert Legacy Restriction.
INSERT INTO
  restrictions (
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial' :: sims.restriction_types,
    'LGCY',
    'Legacy System Restriction',
    'Other',
    ARRAY ['Stop part time disbursement',
'Stop full time disbursement'] :: sims.restriction_action_types [],
    'Error' :: sims.restriction_notification_types
  );