ALTER TABLE
  sims.coe_denied_reasons DROP COLUMN offering_intensity;

DELETE FROM
  sims.coe_denied_reasons
WHERE
  id IN (7, 8);