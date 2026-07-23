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