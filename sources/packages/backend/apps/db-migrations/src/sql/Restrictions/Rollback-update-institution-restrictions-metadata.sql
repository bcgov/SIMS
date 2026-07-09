UPDATE
    sims.restrictions
SET
    metadata = '{"fieldRequirements":{ "location": "not allowed", "program": "not allowed" }}' :: JSONB
WHERE
    restriction_code = 'IUR';

UPDATE
    sims.restrictions
SET
    metadata = '{"fieldRequirements":{ "program": "required", "location": "required" }}' :: JSONB
WHERE
    restriction_code = 'SUS';