-- Add other_regulating_body column to institutions table
ALTER TABLE sims.institutions ADD COLUMN IF NOT EXISTS other_regulating_body VARCHAR(100);

COMMENT ON COLUMN sims.institutions.other_regulating_body IS 'Allows the user to enter the description if the option other is selected from the regulating body dropdown';