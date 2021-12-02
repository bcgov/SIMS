/*
 * Inserts into sims.student_restrictions all the federal restrictions
 * that are not present and active in the table. The same federal restriction
 * can be activated and deactivated multiple times for the same student,
 * generating a new record for every time that the restriction changes its state.
 */
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