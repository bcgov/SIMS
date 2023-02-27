-- Drop other_regulating_body column from institutions table
ALTER TABLE sims.institutions DROP COLUMN IF EXISTS other_regulating_body;