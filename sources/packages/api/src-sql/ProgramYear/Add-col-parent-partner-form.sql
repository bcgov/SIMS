ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS form_name_parent VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS form_name_partner VARCHAR(100) NOT NULL DEFAULT '';

COMMENT ON COLUMN sims.program_years.form_name_parent IS 'Parent form to be loaded for a particular Program year.';

COMMENT ON COLUMN sims.program_years.form_name_partner IS 'Partner form to be loaded for a particular Program year.';

UPDATE
  sims.program_years
SET
  form_name_parent = 'supportingusersparent2021-2022',
  form_name_partner = 'supportinguserspartner2021-2022'
WHERE
  program_year = '2021-2022';

UPDATE
  sims.program_years
SET
  form_name_parent = 'supportingusersparent2022-2023',
  form_name_partner = 'supportinguserspartner2022-2023'
WHERE
  program_year = '2022-2023';

UPDATE
  sims.program_years
SET
  form_name_parent = 'supportingusersparent2023-2024',
  form_name_partner = 'supportinguserspartner2022-2023'
WHERE
  program_year = '2023-2024';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
  sims.program_years
ALTER COLUMN
  form_name_parent DROP DEFAULT;

ALTER TABLE
  sims.program_years
ALTER COLUMN
  form_name_partner DROP DEFAULT;