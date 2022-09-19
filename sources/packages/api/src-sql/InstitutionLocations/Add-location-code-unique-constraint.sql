-- Remove existing codes to avoid conflicts while creating the constraint.
UPDATE
  sims.institution_locations
SET
  institution_code = NULL;

-- Create the unique contraint for institution_id and institution_code.
ALTER TABLE
  sims.institution_locations
ADD
  CONSTRAINT institution_id_institution_code_unique UNIQUE (institution_id, institution_code);

COMMENT ON CONSTRAINT institution_id_institution_code_unique ON sims.institution_locations IS 'Ensures the location code will be unique for a particular institution. The uniqueness is critical to allow the offering bulk upload which uses the location code as a unique identifier for a location under a specific institution.'