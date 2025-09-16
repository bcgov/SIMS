-- Deleting the Federal AV restriction as it is no longer needed and no maintenance is required in production.
DELETE FROM
    sims.restrictions
WHERE
    restriction_type = 'Federal'
    AND restriction_code = 'AV';