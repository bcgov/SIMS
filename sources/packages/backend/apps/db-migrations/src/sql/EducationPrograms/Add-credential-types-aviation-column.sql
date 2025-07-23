ALTER TABLE
  sims.education_programs
ADD
  COLUMN credential_types_aviation jsonb;

COMMENT ON COLUMN sims.education_programs.credential_types_aviation IS 'Aviation program credential types.';

ALTER TABLE
  sims.education_programs_history
ADD
  COLUMN credential_types_aviation jsonb;

COMMENT ON COLUMN sims.education_programs_history.credential_types_aviation IS 'Historical data from the original table. See the original table comments for details.';