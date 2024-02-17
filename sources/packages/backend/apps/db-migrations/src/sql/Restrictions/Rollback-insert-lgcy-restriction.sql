-- Rollback insert Legacy Restriction.
DELETE FROM
  sims.restrictions r
WHERE
  r.restriction_code = 'LGCY';