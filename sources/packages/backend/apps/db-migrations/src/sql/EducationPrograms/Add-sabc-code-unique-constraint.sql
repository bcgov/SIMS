-- Remove existing codes to avoid conflicts while creating the constraint.
UPDATE
  sims.education_programs
SET
  sabc_code = NULL;

-- Create the unique contraint for institution_id and sabc_code.
ALTER TABLE
  sims.education_programs
ADD
  CONSTRAINT institution_id_sabc_code_unique UNIQUE (institution_id, sabc_code);

COMMENT ON CONSTRAINT institution_id_sabc_code_unique ON sims.education_programs IS 'Ensures SABC code will be unique for a particular institution. The uniqueness is critical to allow the offering bulk upload which uses the SABC code as a unique identifier for a program under a specific institution.';