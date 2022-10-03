ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS parent_form_name VARCHAR(100) NOT NULL DEFAULT '';

ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS partner_form_name VARCHAR(100) NOT NULL DEFAULT '';

COMMENT ON COLUMN sims.program_years.parent_form_name IS 'Parent form to be loaded for a particular Program year.';

COMMENT ON COLUMN sims.program_years.partner_form_name IS 'Partner form to be loaded for a particular Program year.';

UPDATE
  sims.program_years
SET
  parent_form_name = 'supportingusersparent2021-2022',
  partner_form_name = 'supportinguserspartner2021-2022'
WHERE
  program_year = '2021-2022';

UPDATE
  sims.program_years
SET
  parent_form_name = 'supportingusersparent2022-2023',
  partner_form_name = 'supportinguserspartner2022-2023'
WHERE
  program_year = '2022-2023';

UPDATE
  sims.program_years
SET
  parent_form_name = 'supportingusersparent2023-2024',
  partner_form_name = 'supportinguserspartner2022-2023'
WHERE
  program_year = '2023-2024';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE
  sims.program_years
ALTER COLUMN
  parent_form_name DROP DEFAULT;

ALTER TABLE
  sims.program_years
ALTER COLUMN
  partner_form_name DROP DEFAULT;