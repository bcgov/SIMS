-- Revert regulatory_body 'ptiru' back to 'ptib'.
UPDATE
    sims.education_programs
SET
    regulatory_body = 'ptib'
WHERE
    regulatory_body = 'ptiru';