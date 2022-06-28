ALTER TABLE
  sims.institutions RENAME COLUMN guid TO business_guid;

ALTER TABLE
  sims.institutions
ALTER COLUMN
  business_guid DROP NOT NULL;

COMMENT ON COLUMN sims.institutions.business_guid IS 'Business identifier of an institution.';