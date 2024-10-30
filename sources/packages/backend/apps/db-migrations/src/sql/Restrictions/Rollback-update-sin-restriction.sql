-- Revert the updates for the restriction SINR
UPDATE
    sims.restrictions
SET
    restriction_code = 'SINF'
WHERE
    restriction_code = 'SINR';