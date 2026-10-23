UPDATE
    sims.restrictions
SET
    description = 'BC portion of loan in delinquency. Not eligible for BCSL. Eligible for CSL.',
    action_type = ARRAY ['Stop full-time BC loan', 'Stop full-time BC grants'] :: sims.restriction_action_types [],
    notification_type = 'Error' :: sims.restriction_notification_types
WHERE
    restriction_code = 'B2D';
