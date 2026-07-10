UPDATE
    sims.restrictions
SET
    metadata = '{
        "messages": {
            "institutionBanner": "Your institution is currently under review.",
            "studentAcceptAssessment": "Your assessment cannot be accepted at this time because the institution associated with your application is currently under review."
        },
        "institutionRestrictionScope": "institution",
        "fieldRequirements": {
            "program": "not allowed",
            "location": "not allowed"
        }
    }' :: JSONB
WHERE
    restriction_code = 'IUR';

UPDATE
    sims.restrictions
SET
    metadata = '{
        "messages": {
            "ministryBanner": "This program is currently restricted."
        },
        "institutionRestrictionScope": "program",
        "fieldRequirements": {
            "program": "required",
            "location": "required"
        }
    }' :: JSONB
WHERE
    restriction_code = 'SUS';