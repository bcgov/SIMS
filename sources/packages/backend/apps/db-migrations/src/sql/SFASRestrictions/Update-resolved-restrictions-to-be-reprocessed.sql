-- Update resolved restrictions associated with a SIMS student to be reprocessed.
UPDATE
    sims.sfas_restrictions
SET
    processed = false
FROM
    sims.sfas_individuals
WHERE
    sims.sfas_individuals.id = sims.sfas_restrictions.individual_id
    AND sims.sfas_restrictions.processed = true
    AND sims.sfas_restrictions.removal_date IS NOT NULL
    AND sims.sfas_restrictions.code IN ('SSD', 'SSR', 'SSRN')
    AND sims.sfas_individuals.student_id IS NOT NULL;