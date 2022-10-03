-- Drop offering_intensity
ALTER TABLE
    sims.msfaa_numbers DROP COLUMN IF EXISTS offering_intensity;

-- Drop cancelled_date
ALTER TABLE
    sims.msfaa_numbers DROP COLUMN IF EXISTS cancelled_date;

-- Drop new_issuing_province
ALTER TABLE
    sims.msfaa_numbers DROP COLUMN IF EXISTS new_issuing_province;