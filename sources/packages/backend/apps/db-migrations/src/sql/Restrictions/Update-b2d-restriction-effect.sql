-- Update the B2D restriction to have no effect and no notification, and update its description.
UPDATE
    sims.restrictions
SET
    description = 'BC portion of loan in delinquency.',
    action_type = ARRAY ['No effect'] :: sims.restriction_action_types [],
    notification_type = 'No effect' :: sims.restriction_notification_types
WHERE
    restriction_code = 'B2D';
