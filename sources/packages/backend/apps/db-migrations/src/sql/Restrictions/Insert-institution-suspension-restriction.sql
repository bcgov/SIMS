INSERT INTO
  sims.restrictions (
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Institution' :: sims.restriction_types,
    'SUS',
    'Program suspended.',
    'Other',
    ARRAY ['Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types [],
    'Error' :: sims.restriction_notification_types
  );