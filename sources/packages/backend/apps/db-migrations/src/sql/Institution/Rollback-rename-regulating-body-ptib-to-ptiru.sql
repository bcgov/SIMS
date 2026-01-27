-- Revert regulating_body 'ptiru' back to 'ptib'
UPDATE
    sims.institutions
SET
    regulating_body = 'ptib'
WHERE
    regulating_body = 'ptiru';