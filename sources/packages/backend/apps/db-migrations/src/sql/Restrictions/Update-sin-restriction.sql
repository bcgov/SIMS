-- Update restriction_code for the restriction code SINF
UPDATE
    sims.restrictions
SET
    restriction_code = 'SINR'
WHERE
    restriction_code = 'SINF';