-- Update AV, 5, 7 and 9 restriction code.
UPDATE
  sims.restrictions
SET
  action_type = ARRAY ['Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
  restriction_code IN ('AV', '5', '7', '9');

-- Add new restriction for BCSL lifetime maximum.
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
    'BCLM',
    'BC lifetime maximum reached.',
    'Other',
    ARRAY ['Stop full time BC funding'] :: sims.restriction_action_types [],
    'Error'
  );