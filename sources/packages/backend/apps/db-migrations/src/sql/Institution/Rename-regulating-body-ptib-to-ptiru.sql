-- Rename regulating_body 'ptib' to 'ptiru'.
UPDATE
    sims.institutions
SET
    regulating_body = 'ptiru'
WHERE
    regulating_body = 'ptib';