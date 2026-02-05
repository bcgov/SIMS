-- Rename regulatory_body 'ptib' to 'ptiru'.
UPDATE
    sims.education_programs
SET
    regulatory_body = 'ptiru'
WHERE
    regulatory_body = 'ptib';