UPDATE
    sims.restrictions
SET
    metadata = '{
        "messages": {
            "ministryBanner": "This program is currently restricted.",
            "studentAcceptAssessment": "Your application is currently pending further review by StudentAid BC."
        },
        "institutionRestrictionScope": "program",
        "fieldRequirements": {
            "program": "required",
            "location": "required"
        }
    }' :: JSONB
WHERE
    restriction_code = 'SUS';