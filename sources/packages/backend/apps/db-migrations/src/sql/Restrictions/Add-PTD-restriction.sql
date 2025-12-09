INSERT INTO
  sims.restrictions(
    restriction_type,
    restriction_code,
    description,
    restriction_category,
    action_type,
    notification_type
  )
VALUES
  (
    'Provincial',
    'PTD',
    'Account closed by province.',
    'Other',
    ARRAY ['Stop part time apply', 'Stop full time apply', 'Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types [],
    'Error'
  );