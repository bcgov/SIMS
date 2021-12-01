INSERT INTO
    sims.student_restrictions(student_id, restriction_id, is_active)
SELECT
    fed_restrictions.student_id student_id,
    fed_restrictions.restriction_id restriction_id,
    true is_active
FROM
    sims.federal_restrictions fed_restrictions
    INNER JOIN sims.students students on students.id = fed_restrictions.student_id
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            sims.student_restrictions student_restrictions
        WHERE
            student_restrictions.student_id = fed_restrictions.student_id
            AND student_restrictions.restriction_id = fed_restrictions.restriction_id
            AND student_restrictions.is_active = true
    )