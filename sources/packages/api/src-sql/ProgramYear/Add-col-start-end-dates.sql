ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT NOW();

ALTER TABLE
  sims.program_years
ADD
  COLUMN IF NOT EXISTS end_date DATE NOT NULL DEFAULT NOW();

COMMENT ON COLUMN sims.program_years.start_date IS 'Inclusive start date for the program year.';

COMMENT ON COLUMN sims.program_years.end_date IS 'Inclusive end date for the program year.';