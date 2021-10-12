-- Add the new column to create the relationship with supporting users table (parent/patner).
ALTER TABLE
  sims.cra_income_verifications
ADD
  COLUMN IF NOT EXISTS supporting_user_id INT REFERENCES sims.supporting_users(id) ON DELETE CASCADE;

COMMENT ON COLUMN sims.cra_income_verifications.supporting_user_id IS 'Supporting user that needs to provide additional information for the Student Application.';

-- Remove previously added constraint that is no longer valid.
ALTER TABLE
  sims.cra_income_verifications DROP CONSTRAINT cra_income_verifications_application_id_key;

-- Create the new constraint including the newly added column supporting_user_id.
ALTER TABLE
  sims.cra_income_verifications
ADD
  CONSTRAINT cra_income_verifications_application_id_supporting_user_id UNIQUE (application_Id, supporting_user_id)