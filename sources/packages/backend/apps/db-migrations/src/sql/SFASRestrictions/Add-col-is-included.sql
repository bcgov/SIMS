ALTER TABLE
  sims.sfas_restrictions
ADD
  COLUMN processed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sfas_restrictions.processed IS 'This field indicates whether the SFAS restriction has been added to the student restrictions table or not.';