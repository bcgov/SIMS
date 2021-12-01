UPDATE
    sims.student_restrictions
SET
    updated_at = now()
FROM
    sims.restrictions restrictions
WHERE
    sims.student_restrictions.is_active = true
    AND restrictions.id = sims.student_restrictions.restriction_id
    AND restrictions.restriction_type = 'Federal'
    AND EXISTS (
        SELECT
            1
        FROM
            sims.federal_restrictions federal_restrictions
        WHERE
            federal_restrictions.student_id = sims.student_restrictions.student_id
            AND federal_restrictions.restriction_id = sims.student_restrictions.restriction_id
    )