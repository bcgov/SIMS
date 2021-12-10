-- Create offering_intensity
ALTER TABLE
    sims.msfaa_numbers
ADD
    COLUMN IF NOT EXISTS offering_intensity VARCHAR(10) NOT NULL DEFAULT 'Full Time';

COMMENT ON COLUMN sims.msfaa_numbers.offering_intensity IS 'Offering intensity for the MSFAA Number Part Time/ Full Time.';

--Default constraint for the offering_intensity is removed after the not null constraint is enforced
ALTER TABLE
    sims.msfaa_numbers
ALTER
    COLUMN offering_intensity DROP DEFAULT;    