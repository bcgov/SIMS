-- Update action_type for the restriction SUS to remove action 'Stop offering create'.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part-time disbursement','Stop full-time disbursement'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'SUS';