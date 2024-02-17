/* 
 * After all the SFAS individuals are imported, 
 * the below query inserts one Legacy restriction entry 
 * per student if they have one or more restrictions 
 * imported from the sfas system that are not present 
 * in the sims restrictions.
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id)
SELECT
  DISTINCT(i.student_id),
  (
    SELECT
      res.id
    FROM
      sims.restrictions res
    WHERE
      res.restriction_code = 'LGCY'
  ) AS restriction_id
FROM
  (
    SELECT
      res.code,
      CASE
        WHEN res.code = 'A12' THEN '12'
        WHEN res.code = 'AF1' THEN 'AF'
        WHEN res.code = 'B2D' THEN 'B2'
        ELSE res.code
      END AS mapped_code,
      res.individual_id,
      res.is_included
    FROM
      sims.sfas_restrictions res
    WHERE
      res.removal_date IS NULL
      AND res.is_included IS FALSE
  ) r
  INNER JOIN sims.sfas_individuals i ON r.individual_id = i.id
  LEFT JOIN sims.restrictions restrictions ON r.mapped_code = restrictions.restriction_code
WHERE
  i.student_id IS NOT NULL
  AND restrictions.restriction_code IS NULL;

/* 
 * The below query inserts restrictions from sfas 
 * if those restrictions are valid restrictions 
 * in the sims system and are either not present in the 
 * sims student restrictions table or they are inactive. 
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id)
SELECT
  (i.student_id),
  restrictions.id AS restriction_id
FROM
  (
    SELECT
      res.code,
      CASE
        WHEN res.code = 'A12' THEN '12'
        WHEN res.code = 'AF1' THEN 'AF'
        WHEN res.code = 'B2D' THEN 'B2'
        ELSE res.code
      END AS mapped_code,
      res.individual_id,
      res.is_included
    FROM
      sims.sfas_restrictions res
    WHERE
      res.removal_date IS NULL
      AND res.is_included IS FALSE
  ) r
  INNER JOIN sims.sfas_individuals i ON r.individual_id = i.id
  INNER JOIN sims.restrictions restrictions ON r.mapped_code = restrictions.restriction_code
  LEFT JOIN sims.student_restrictions str ON str.student_id = i.student_id
  AND str.restriction_id = restrictions.id
WHERE
  i.student_id IS NOT NULL
  AND str.is_active IS FALSE
  OR str.restriction_id IS NULL;