-- Revert the updates for the restriction code AV, 5, 7 and 9.
UPDATE
  sims.restrictions
SET
  action_type = ARRAY ['Stop part time disbursement', 'Stop full time disbursement'] :: sims.restriction_action_types []
WHERE
  restriction_code IN ('AV', '5', '7', '9');

--Remove the restriction for BCSL lifetime maximum.
DELETE FROM
  sims.restrictions
WHERE
  restriction_code = 'BCLM';