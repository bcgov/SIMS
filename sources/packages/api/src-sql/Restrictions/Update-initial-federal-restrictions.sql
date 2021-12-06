-- Remove the first character for the federal restrictions.
-- All federal restrictions have a C in the beginning that it is not part of the real restriction codes received from federal integration.
-- The C prefix was required by SFAS but it is no longer required.
UPDATE
    sims.restrictions
SET
    restriction_code = RIGHT(restriction_code, LENGTH(restriction_code) - 1)
WHERE
    restriction_type = 'Federal'