/* 
 * After all the SFAS restrictions are imported, 
 * the below query inserts restrictions from SFAS 
 * if those restrictions are valid restrictions 
 * in the sims system if they are either not present in the 
 * sims student restrictions table or they are inactive. All
 * the restrictions dealt here are provincial restrictions only. 
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id, creator, created_at)
SELECT
  sfas_individuals.student_id,
  restrictions.id,
  $1,
  $2
FROM
  (
    -- select sfas_restrictions records with mapped restriction (from SFAS to SIMS) codes
    -- and join with restrictions and student_restrictions table to
    -- get the student ids to create restrictions.
    SELECT
      coalesce(
        sfas_restriction_maps.code,
        sfas_restrictions.code
      ) mapped_code,
      sfas_restrictions.individual_id
    FROM
      sims.sfas_restrictions sfas_restrictions
      LEFT JOIN sims.sfas_restriction_maps sfas_restriction_maps ON sfas_restriction_maps.legacy_code = sfas_restrictions.code
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