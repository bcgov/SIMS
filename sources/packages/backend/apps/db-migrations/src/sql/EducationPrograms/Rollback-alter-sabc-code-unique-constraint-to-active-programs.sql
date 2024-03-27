-- Remove existing index to allow the creation of the previous constraint.
DROP INDEX sims.institution_id_sabc_code_unique;

-- Create the unique constraint for institution_id and sabc_code.
ALTER TABLE
  sims.education_programs
ADD
  CONSTRAINT institution_id_sabc_code_unique UNIQUE (institution_id, sabc_code);

COMMENT ON CONSTRAINT institution_id_sabc_code_unique ON sims.education_programs IS 'Ensures SABC code will be unique for a particular institution. The uniqueness is critical to allow the offering bulk upload which uses the SABC code as a unique identifier for a program under a specific institution.';