INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        restriction_category,
        action_type,
        notification_type,
        metadata
    )
VALUES
    (
        'Institution' :: sims.restriction_types,
        'IUR',
        'Institution under review.',
        'Institution',
        ARRAY [
            'Stop part-time application eligibility',
            'Stop full-time application eligibility',
            'Stop full-time accept assessment',
            'Stop part-time accept assessment'
        ] :: sims.restriction_action_types [],
        'Error' :: sims.restriction_notification_types,
        '{"fieldRequirements":{ "location": "not allowed", "program": "not allowed" }}' :: JSONB
    );