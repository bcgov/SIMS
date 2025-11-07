ALTER TABLE
    sims.program_years
ADD
    COLUMN offering_intensity sims.offering_intensity [] DEFAULT ARRAY ['Part Time', 'Full Time'] :: sims.offering_intensity [];

COMMENT ON COLUMN sims.program_years.offering_intensity IS 'Offering intensities allowed for the program year.';

-- Update part-time only program years.
UPDATE
    sims.program_years
SET
    offering_intensity = ARRAY ['Part Time'] :: sims.offering_intensity []
WHERE
    start_date < '2025-08-01';