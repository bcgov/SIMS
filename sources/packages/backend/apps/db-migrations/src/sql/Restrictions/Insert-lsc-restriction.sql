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
    'LSC',
    'Location suspended.',
    'Location',
    ARRAY ['Stop part-time disbursement', 'Stop full-time disbursement', 'Stop full-time accept assessment', 'Stop part-time accept assessment'] :: sims.restriction_action_types [],
    'No effect' :: sims.restriction_notification_types,
    '{
        "messages": {
            "studentAcceptAssessment": "Your application is currently pending further review by StudentAid BC."
        },
        "institutionRestrictionScope": "location",
        "fieldRequirements": {
            "location": "required",
            "program": "not allowed"
        }
    }' :: JSONB
  );