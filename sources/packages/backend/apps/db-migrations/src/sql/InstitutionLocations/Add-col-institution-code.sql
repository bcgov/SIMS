-- Add institution_code to institutions table
ALTER TABLE
  sims.institution_locations
ADD
  COLUMN IF NOT EXISTS institution_code CHAR(4);

COMMENT ON COLUMN sims.institution_locations.institution_code IS 'institution_code is Institution Code with 4 Upper Case Letters, this is a nullable field';