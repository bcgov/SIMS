/* 
 * After all the SFAS restrictions are imported, 
 * the below query inserts one Legacy restriction entry 
 * per student if they have one or more restrictions 
 * imported from the sfas system that are not present 
 * in the sims restrictions.
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id)
SELECT
  students.student_id,
  (
    SELECT
      restrictions.id
    FROM
      sims.restrictions restrictions
    WHERE
      restrictions.restriction_code = 'LGCY'
  ) AS restriction_id
FROM
  (
    (
      SELECT
        student_restrictions.student_id AS student_id
      FROM
        sims.student_restrictions student_restrictions
      WHERE
        student_restrictions.restriction_id = (
          SELECT
            id
          FROM
            sims.restrictions
          WHERE
            restriction_code = 'LGCY'
        )
        AND student_restrictions.is_active = true
    ) filtered_student_restrictions
    RIGHT JOIN (
      SELECT
        DISTINCT(sfas_individuals.student_id) AS student_id
      FROM
        (
          SELECT
            sfas_restrictions.code,
            CASE
              WHEN sfas_restrictions.code = 'A12' THEN '12'
              WHEN sfas_restrictions.code = 'AF1' THEN 'AF'
              WHEN sfas_restrictions.code = 'B2D' THEN 'B2'
              ELSE sfas_restrictions.code
            END AS mapped_code,
            sfas_restrictions.individual_id,
            sfas_restrictions.processed
          FROM
            sims.sfas_restrictions sfas_restrictions
          WHERE
            sfas_restrictions.removal_date IS NULL
            AND sfas_restrictions.processed = false
        ) mapped_restrictions
        INNER JOIN sims.sfas_individuals sfas_individuals ON mapped_restrictions.individual_id = sfas_individuals.id
        LEFT JOIN sims.restrictions restrictions ON mapped_restrictions.mapped_code = restrictions.restriction_code
      WHERE
        sfas_individuals.student_id IS NOT NULL
        AND restrictions.restriction_code IS NULL
    ) students ON filtered_student_restrictions.student_id = students.student_id
  )
WHERE
  filtered_student_restrictions.student_id IS NULL;

/* 
 * After all the SFAS restrictions are imported, 
 * the below query inserts restrictions from sfas 
 * if those restrictions are valid restrictions 
 * in the sims system and are either not present in the 
 * sims student restrictions table or they are inactive. 
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id)
SELECT
  (sfas_individuals.student_id),
  restrictions.id AS restriction_id
FROM
  (
    SELECT
      sfas_restrictions.code,
      CASE
        WHEN sfas_restrictions.code = 'A12' THEN '12'
        WHEN sfas_restrictions.code = 'AF1' THEN 'AF'
        WHEN sfas_restrictions.code = 'B2D' THEN 'B2'
        ELSE sfas_restrictions.code
      END AS mapped_code,
      sfas_restrictions.individual_id,
      sfas_restrictions.processed
    FROM
      sims.sfas_restrictions sfas_restrictions
    WHERE
      sfas_restrictions.removal_date IS NULL
      AND sfas_restrictions.processed = false
  ) mapped_restrictions
  INNER JOIN sims.sfas_individuals sfas_individuals ON mapped_restrictions.individual_id = sfas_individuals.id
  INNER JOIN sims.restrictions restrictions ON mapped_restrictions.mapped_code = restrictions.restriction_code
  LEFT JOIN sims.student_restrictions student_restrictions ON student_restrictions.student_id = sfas_individuals.student_id
  AND student_restrictions.restriction_id = restrictions.id
WHERE
  sfas_individuals.student_id IS NOT NULL
  AND student_restrictions.is_active = false
  OR student_restrictions.restriction_id IS NULL;

/*
 * Once all the restrictions have been added,
 * mark the processed column to true for all
 * the newly imported restrictions.
 */
UPDATE
  sims.sfas_restrictions
SET
  processed = true
WHERE
  processed = false;