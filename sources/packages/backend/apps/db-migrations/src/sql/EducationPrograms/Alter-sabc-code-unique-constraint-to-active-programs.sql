-- Remove existing constraint to allow the creation of the new index.
ALTER TABLE
  sims.education_programs DROP CONSTRAINT institution_id_sabc_code_unique;

CREATE UNIQUE INDEX institution_id_sabc_code_unique ON sims.education_programs(institution_id, sabc_code)
WHERE
  is_active = TRUE;

COMMENT ON INDEX sims.institution_id_sabc_code_unique IS 'Ensures SABC code will be unique for active programs under a particular institution. The uniqueness is critical to allow the offering bulk upload which uses the SABC code as a unique identifier for a program under a specific institution.';