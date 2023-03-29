-- Updated the submitted_data column from NOT NULL to NULL
ALTER TABLE sims.designation_agreements ALTER COLUMN submitted_data DROP NOT NULL;