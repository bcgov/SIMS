-- Remove the constraint previously created.
ALTER TABLE
  sims.cra_income_verifications DROP CONSTRAINT IF EXISTS cra_income_verifications_application_id_supporting_user_id;

-- Recreate the constraint previously removed.
ALTER TABLE
  sims.cra_income_verifications
ADD
  CONSTRAINT cra_income_verifications_application_id_key UNIQUE (application_Id);

-- Remove the column added previously.
ALTER TABLE
  sims.cra_income_verifications DROP COLUMN IF EXISTS supporting_user_id;