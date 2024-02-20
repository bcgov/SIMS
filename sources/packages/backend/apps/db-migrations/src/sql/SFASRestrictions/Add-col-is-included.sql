ALTER TABLE
  sims.sfas_restrictions
ADD
  COLUMN is_included bool DEFAULT FALSE;

COMMENT ON COLUMN sfas_restrictions.is_included IS 'This field indicates whether the SFAS restriction has been added to the student restrictions table or not.';