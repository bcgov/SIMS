-- Update action_type for the restriction code SINF
UPDATE
    sims.restrictions
SET
    restriction_code = 'SINR'
WHERE
    restriction_code = 'SINF';