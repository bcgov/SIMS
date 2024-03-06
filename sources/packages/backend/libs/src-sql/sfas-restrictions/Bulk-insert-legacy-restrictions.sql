/* 
 * After all the SFAS restrictions are imported, 
 * the below query inserts one Legacy restriction entry 
 * per student if they have one or more restrictions 
 * imported from the sfas system that are not present 
 * in the sims restrictions. All the restrictions dealt 
 * here are provincial restrictions only. 
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id, creator)
SELECT
  filtered_students.student_id,
  $1,
  $2
FROM
  (
    SELECT
      DISTINCT(sfas_individuals.student_id) AS student_id
    FROM
      (
        SELECT
          CASE
            WHEN sfas_restrictions.code = 'A12' THEN '12'
            WHEN sfas_restrictions.code = 'AF1' THEN 'AF'
            WHEN sfas_restrictions.code = 'B2D' THEN 'B2'
            ELSE sfas_restrictions.code
          END AS mapped_code,
          sfas_restrictions.individual_id
        FROM
          sims.sfas_restrictions sfas_restrictions
        WHERE
          sfas_restrictions.removal_date IS NULL
          AND sfas_restrictions.processed = FALSE
      ) mapped_restrictions
      INNER JOIN sims.sfas_individuals sfas_individuals ON mapped_restrictions.individual_id = sfas_individuals.id
      LEFT JOIN sims.restrictions restrictions ON mapped_restrictions.mapped_code = restrictions.restriction_code
    WHERE
      sfas_individuals.student_id IS NOT NULL
      AND restrictions.restriction_code IS NULL
  ) filtered_students
WHERE
  -- The below part of the query checks that for every student id which is a  
  -- potential candidate to be inserted in the sims student_restrictions table
  -- (using the above part of the query), if there is already a pre-existing active 
  -- LGCY restriction entry for that student in this table. If yes, the insert for 
  -- LGCY restriction does not happen for that student. If no, a LGCY restriction
  -- entry is made for that student in the student_restrictions table.
  NOT EXISTS (
    SELECT
      1
    FROM
      sims.student_restrictions student_restrictions
    WHERE
      student_restrictions.student_id = filtered_students.student_id
      AND student_restrictions.restriction_id = $1
      AND student_restrictions.is_active = TRUE
  ) RETURNING student_id;