/* 
 * After all the SFAS restrictions are imported, 
 * the below query inserts restrictions from sfas 
 * if those restrictions are valid restrictions 
 * in the sims system if they are either not present in the 
 * sims student restrictions table or they are inactive. All
 * the restrictions dealt here are provincial restrictions only. 
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id, creator)
SELECT
  sfas_individuals.student_id,
  restrictions.id,
  $1
FROM
  (
    -- select sfas_restrictions records with mapped restriction (from SFAS to SIMS) codes
    -- and join with restrictions and student_restrictions table to
    -- get the student ids to create restrictions.
    SELECT
      CASE
        WHEN sfas_restrictions.code = 'A12' THEN '12'
        WHEN sfas_restrictions.code = 'AF1' THEN 'AF'
        WHEN sfas_restrictions.code = 'B2D' THEN 'B2'
        WHEN sfas_restrictions.code = 'SINR' THEN 'LGCY'
        ELSE sfas_restrictions.code
      END AS mapped_code,
      sfas_restrictions.individual_id
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
  AND student_restrictions.is_active = true
WHERE
  sfas_individuals.student_id IS NOT NULL
  AND student_restrictions.restriction_id IS NULL;