UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part-time disbursement','Stop full-time disbursement','Stop offering create'] :: sims.restriction_action_types [],
    notification_type = 'Error' :: sims.restriction_notification_types
WHERE
    restriction_code = 'SUS';