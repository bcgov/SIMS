-- Add offering_intensity
ALTER TABLE
    sims.msfaa_numbers
ADD
    COLUMN IF NOT EXISTS offering_intensity sims.offering_intensity NOT NULL DEFAULT 'Full Time';

COMMENT ON COLUMN sims.msfaa_numbers.offering_intensity IS 'Offering intensity for the MSFAA Number Part Time/ Full Time.';

ALTER TABLE
    sims.msfaa_numbers
ADD
    COLUMN IF NOT EXISTS new_issuing_province CHAR(2);

COMMENT ON COLUMN sims.msfaa_numbers.new_issuing_province IS 'MSFAA Number New issuing Province.';

ALTER TABLE
    sims.msfaa_numbers
ADD
    COLUMN IF NOT EXISTS cancelled_date DATE;

COMMENT ON COLUMN sims.msfaa_numbers.cancelled_date IS 'MSFAA Number cancelled date';

--Default constraint for the offering_intensity is removed after the not null constraint is enforced
ALTER TABLE
    sims.msfaa_numbers
ALTER
    COLUMN offering_intensity DROP DEFAULT;    