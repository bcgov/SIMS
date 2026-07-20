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
        'ISR',
        'Institution activity suspended.',
        'Institution',
        ARRAY [
            'Stop part-time application eligibility',
            'Stop full-time application eligibility',
            'Stop part-time accept assessment',
            'Stop full-time accept assessment',
            'Stop part-time disbursement',
            'Stop full-time disbursement'
        ] :: sims.restriction_action_types [],
        'Error' :: sims.restriction_notification_types,
        '{
            "messages": {
                "institutionBanner": "Your institution is currently suspended.",
                "studentAcceptAssessment": "Your assessment cannot be accepted at this time because the institution associated with your application is currently suspended."
            },
            "institutionRestrictionScope": "institution",
            "fieldRequirements": {
                "location": "not allowed",
                "program": "not allowed"
            }
        }' :: JSONB
    );