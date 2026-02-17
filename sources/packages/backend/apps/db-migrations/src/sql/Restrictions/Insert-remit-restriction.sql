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
        'Institution' :: sims.restriction_types,
        'REMIT',
        'No direct tuition remittance allowed.',
        'Location',
        ARRAY ['No effect'] :: sims.restriction_action_types [],
        'No effect' :: sims.restriction_notification_types
    );