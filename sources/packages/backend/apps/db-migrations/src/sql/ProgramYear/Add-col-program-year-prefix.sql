ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS program_year_prefix VARCHAR(4) NOT NULL DEFAULT '';

COMMENT ON COLUMN sims.program_years.program_year_prefix IS 'Program Year prefix for a particular Program year.';

UPDATE
  sims.program_years
SET
  program_year_prefix = '2021'
WHERE
  program_year = '2021-2022';

UPDATE
  sims.program_years
SET
  program_year_prefix = '2022'
WHERE
  program_year = '2022-2023';

UPDATE
  sims.program_years
SET
  program_year_prefix = '2023'
WHERE
  program_year = '2023-2024';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.

ALTER TABLE
  sims.program_years
ALTER COLUMN
  program_year_prefix DROP DEFAULT;