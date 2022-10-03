-- Add the C prefix previously removed.
UPDATE
    sims.restrictions
SET
    restriction_code = 'C' || restriction_code
WHERE
    restriction_type = 'Federal'