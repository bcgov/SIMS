-- Delete the restriction for invalid temporary SIN.
DELETE FROM
  sims.restrictions
WHERE
  restriction_code = 'SINF';