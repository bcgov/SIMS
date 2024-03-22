-- Remove column cspt_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN IF EXISTS cspt_award;
  
-- Remove column csgd_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN IF EXISTS csgd_award;

-- Remove column bcag_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN IF EXISTS bcag_award;

-- Remove column cslp_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN IF EXISTS cslp_award;

-- Remove column program_year_id for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN IF EXISTS program_year_id;