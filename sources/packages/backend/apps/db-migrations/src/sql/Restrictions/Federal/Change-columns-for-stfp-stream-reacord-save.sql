-- Allow null values to defer the code association until the record is saved.
ALTER TABLE
    sims.federal_restrictions
ALTER COLUMN
    restriction_id DROP NOT NULL;

-- Add a new column to store the restriction code to later associate it with the restriction_id,
-- when the record is saved or detect if a new restriction must be created.
ALTER TABLE
    sims.federal_restrictions
ADD
    COLUMN restriction_code VARCHAR(50) NOT NULL;

COMMENT ON COLUMN sims.federal_restrictions.restriction_code IS 'Code of the restriction associated with the federal record as received in the file.';