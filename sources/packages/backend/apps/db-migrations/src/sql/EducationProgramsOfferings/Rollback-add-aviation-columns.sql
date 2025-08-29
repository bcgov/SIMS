ALTER TABLE
  sims.education_programs_offerings DROP COLUMN is_aviation_offering,
  DROP COLUMN aviation_credential_type;

ALTER TABLE
  sims.education_programs_offerings_history DROP COLUMN is_aviation_offering,
  DROP COLUMN aviation_credential_type;