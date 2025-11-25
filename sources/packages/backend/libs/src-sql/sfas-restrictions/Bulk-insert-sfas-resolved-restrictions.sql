-- Insert resolved SFAS restrictions into SIMS student_restrictions table.
-- Only SSR and SSRN mapped codes should be considered.
-- If the student already has a restriction (active or not), it should not be inserted again.
-- The student may have multiple resolved restrictions, but only one is required for each code,
-- that is why the DISTINCT clause is used.
INSERT INTO
  sims.student_restrictions (
    student_id,
    restriction_id,
    is_active,
    creator,
    created_at
  )
SELECT
  DISTINCT sfas_individuals.student_id,
  restrictions.id,
  false,
  $1::INT,
  $2::TIMESTAMPTZ
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
      -- Check only resolved restrictions (removal_date IS NOT NULL).
      -- Active restrictions are processed by a separate process.
      sfas_restrictions.removal_date IS NOT NULL
      AND sfas_restrictions.processed = false
  ) mapped_restrictions
  INNER JOIN sims.sfas_individuals sfas_individuals ON mapped_restrictions.individual_id = sfas_individuals.id
  INNER JOIN sims.restrictions restrictions ON mapped_restrictions.mapped_code = restrictions.restriction_code
  LEFT JOIN sims.student_restrictions student_restrictions ON student_restrictions.student_id = sfas_individuals.student_id
  AND student_restrictions.restriction_id = restrictions.id
  AND student_restrictions.deleted_at IS NULL
WHERE
  -- Multiple restrictions can be mapped to SSR or SSRN based in the sfas_restriction_maps table,
  -- so filtering by the mapped codes (instead of limiting the subquery) will ensure that changes
  -- in the configuration would not require further changes in this script.
  mapped_restrictions.mapped_code IN ('SSR', 'SSRN')
  AND sfas_individuals.student_id IS NOT NULL
  AND student_restrictions.restriction_id IS NULL;