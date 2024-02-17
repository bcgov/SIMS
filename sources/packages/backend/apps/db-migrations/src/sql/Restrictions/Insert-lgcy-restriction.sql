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
    ARRAY ['Stop Part Time Disbursement',
'Stop Full Time Disbursement'] :: sims.restriction_action_types [],
    'Error' :: sims.restriction_notification_types
  );