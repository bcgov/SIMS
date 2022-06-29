-- Create restriction for invalid temporary SIN.
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
    'SINF',
    'Student submitted application with incorrect SIN expiry date.',
    'Verification',
    ARRAY ['Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types [],
    'Error'
  );