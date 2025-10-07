INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        restriction_category,
        action_type,
        notification_type
    )
VALUES
    (
        'Federal' :: sims.restriction_types,
        'AV',
        'Student has reached 17 week maximum for aviation program.',
        'Federal',
        ARRAY ['Stop full time disbursement'] :: sims.restriction_action_types [],
        'Error' :: sims.restriction_notification_types
    );