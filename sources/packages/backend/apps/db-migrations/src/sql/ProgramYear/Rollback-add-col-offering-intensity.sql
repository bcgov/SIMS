-- Drop offering_intensity from program_years table.
ALTER TABLE
    sims.program_years DROP COLUMN IF EXISTS offering_intensity;