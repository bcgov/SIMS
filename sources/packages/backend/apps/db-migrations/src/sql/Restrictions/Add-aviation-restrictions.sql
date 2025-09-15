INSERT INTO
    sims.restrictions (
        restriction_type,
        restriction_code,
        description,
        restriction_category,
        action_type,
        action_effective_conditions,
        notification_type,
        is_legacy
    )
VALUES
    (
        'Provincial' :: sims.restriction_types,
        'AVCP',
        'Aviation Commercial Pilot Program funded.',
        'Other',
        ARRAY ['Stop part time disbursement',
    'Stop full time disbursement'] :: sims.restriction_action_types [],
        '[{ "name": "Credential types", "value": ["commercialPilotTraining"] }]' :: JSONB,
        'Error' :: sims.restriction_notification_types,
        FALSE
    ),
    (
        'Provincial' :: sims.restriction_types,
        'AVIR',
        'Aviation Instructor''s Rating funded.',
        'Other',
        ARRAY ['Stop part time disbursement',
    'Stop full time disbursement'] :: sims.restriction_action_types [],
        '[{ "name": "Credential types", "value": ["instructorsRating"] }]' :: JSONB,
        'Error' :: sims.restriction_notification_types,
        FALSE
    ),
    (
        'Provincial' :: sims.restriction_types,
        'AVEN',
        'Aviation Endorsements funded.',
        'Other',
        ARRAY ['Stop part time disbursement',
    'Stop full time disbursement'] :: sims.restriction_action_types [],
        '[{ "name": "Credential types", "value": ["endorsements"] }]' :: JSONB,
        'Error' :: sims.restriction_notification_types,
        FALSE
    ),
    -- Restriction added to support legacy aviation restrictions from SFAS of all credential types.
    (
        'Provincial' :: sims.restriction_types,
        'SFAS_AV',
        'Legacy Aviation Restriction exists in SFAS.',
        'Other',
        ARRAY ['Stop part time disbursement',
    'Stop full time disbursement'] :: sims.restriction_action_types [],
        '[{ "name": "Credential types", "value": ["commercialPilotTraining", "instructorsRating", "endorsements"] }]' :: JSONB,
        'Error' :: sims.restriction_notification_types,
        TRUE
    );