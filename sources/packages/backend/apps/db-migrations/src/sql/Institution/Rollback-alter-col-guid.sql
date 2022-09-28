ALTER TABLE
  sims.institutions RENAME COLUMN business_guid TO guid;

ALTER TABLE
  sims.institutions
ALTER COLUMN
  guid
SET
  NOT NULL;