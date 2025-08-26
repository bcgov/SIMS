ALTER TABLE
  sims.education_programs_offerings
ADD
  COLUMN is_aviation_offering VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs_offerings.is_aviation_offering IS 'Offering is an aviation offering?';

ALTER TABLE
  sims.education_programs_offerings
ADD
  COLUMN aviation_credential_type VARCHAR(50);

COMMENT ON COLUMN sims.education_programs_offerings.aviation_credential_type IS 'Aviation offering credential type.';

ALTER TABLE
  sims.education_programs_offerings
ALTER COLUMN
  is_aviation_offering DROP DEFAULT;