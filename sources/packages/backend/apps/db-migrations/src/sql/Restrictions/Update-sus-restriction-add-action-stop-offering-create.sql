-- Update action_type for the restriction SUS to add action 'Stop offering create'.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part-time disbursement','Stop full-time disbursement','Stop offering create'] :: sims.restriction_action_types []
WHERE
    restriction_code = 'SUS';