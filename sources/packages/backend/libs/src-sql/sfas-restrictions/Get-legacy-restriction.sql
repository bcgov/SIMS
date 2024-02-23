/*
 * Get legacy restriction id.
 */
SELECT
  id
FROM
  sims.restrictions
WHERE
  restriction_code = $1