ALTER TABLE
  sims.education_programs_offerings
ADD
  COLUMN is_aviation_offering VARCHAR(50) NOT NULL DEFAULT 'no',
ADD
  COLUMN aviation_credential_type VARCHAR(50);

COMMENT ON COLUMN sims.education_programs_offerings.is_aviation_offering IS 'Indicates if the offering is an aviation offering.';

COMMENT ON COLUMN sims.education_programs_offerings.aviation_credential_type IS 'Aviation offering credential type.';

ALTER TABLE
  sims.education_programs_offerings
ALTER COLUMN
  is_aviation_offering DROP DEFAULT;

ALTER TABLE
  sims.education_programs_offerings_history
ADD
  COLUMN is_aviation_offering VARCHAR(50);

COMMENT ON COLUMN sims.education_programs_offerings_history.is_aviation_offering IS 'Historical data from the original table. See original table comments for details.';

ALTER TABLE
  sims.education_programs_offerings_history
ADD
  COLUMN aviation_credential_type VARCHAR(50);

COMMENT ON COLUMN sims.education_programs_offerings_history.aviation_credential_type IS 'Historical data from the original table. See original table comments for details.';

ALTER TABLE
  sims.education_programs_offerings_history
ALTER COLUMN
  is_aviation_offering DROP DEFAULT;