ALTER TABLE
  sims.sfas_restrictions
ADD
  COLUMN processed BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sfas_restrictions.processed IS 'This field indicates if a SFAS restriction record was verified to determine if a restriction must be created in the student account.';