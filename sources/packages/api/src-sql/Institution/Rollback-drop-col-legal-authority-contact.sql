-- Add legal_authority_contact to institutions table
ALTER TABLE
    sims.institutions
ADD
    COLUMN IF NOT EXISTS legal_authority_contact JSONB NOT NULL DEFAULT '{}' :: jsonb;

COMMENT ON COLUMN sims.institutions.legal_authority_contact IS 'A JSONB structure to store Legal Authorities Contact Information';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
    sims.institutions
ALTER COLUMN
    legal_authority_contact DROP DEFAULT;