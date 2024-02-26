-- Rollback insert Legacy Restriction.
DELETE FROM
  sims.restrictions
WHERE
  restriction_code = 'LGCY';