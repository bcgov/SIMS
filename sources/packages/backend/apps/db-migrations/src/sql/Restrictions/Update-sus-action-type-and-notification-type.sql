-- Update action_type for the restriction SUS to remove action 'Stop offering create'
-- and change the notification_type to 'No effect'.
UPDATE
    sims.restrictions
SET
    action_type = ARRAY ['Stop part-time disbursement','Stop full-time disbursement'] :: sims.restriction_action_types [],
    notification_type = 'No effect' :: sims.restriction_notification_types
WHERE
    restriction_code = 'SUS';