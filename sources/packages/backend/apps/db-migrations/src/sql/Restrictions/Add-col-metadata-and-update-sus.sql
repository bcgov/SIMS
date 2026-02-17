ALTER TABLE
    sims.restrictions
ADD
    COLUMN metadata JSONB;

COMMENT ON COLUMN sims.restrictions.metadata IS 'Restriction metadata.';

-- Populate the metadata for SUS restriction.
UPDATE
    sims.restrictions
SET
    metadata = '{"constraints":{ "location": "required", "program": "required" }}' :: JSONB
WHERE
    restriction_code = 'SUS';