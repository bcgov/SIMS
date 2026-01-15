/* 
 * After all sfas_applications are imported (full-time table only), evaluate
 * the withdrawals columns (withdrawal_date, withdrawal_reason, withdrawal_active_flag)
 * and insert a SIMS WTHD restriction, if an active one is not present.
 */
INSERT INTO
  sims.student_restrictions (student_id, restriction_id, creator, created_at)
SELECT
  sfas_individuals.student_id,
  $1, -- WTHD restriction ID.
  $2, -- Creator user ID.
  $3  -- Created at timestamp.
FROM
  (
    SELECT
      sfas_applications.individual_id
    FROM
      sims.sfas_applications sfas_applications
    WHERE
      sfas_applications.withdrawal_date IS NOT NULL
      AND sfas_applications.withdrawal_reason != 'NPWD'
      AND sfas_applications.withdrawal_active_flag != 'Y'
      AND sfas_applications.wthd_processed = FALSE
  ) applications_wthd_restrictions
  INNER JOIN sims.sfas_individuals sfas_individuals ON applications_wthd_restrictions.individual_id = sfas_individuals.id
  LEFT JOIN sims.student_restrictions student_restrictions
    ON student_restrictions.student_id = sfas_individuals.student_id
      AND student_restrictions.restriction_id = $1 -- WTHD restriction ID.
      AND student_restrictions.is_active = TRUE
      AND student_restrictions.deleted_at IS NULL
WHERE
  sfas_individuals.student_id IS NOT NULL
  AND student_restrictions.restriction_id IS NULL;