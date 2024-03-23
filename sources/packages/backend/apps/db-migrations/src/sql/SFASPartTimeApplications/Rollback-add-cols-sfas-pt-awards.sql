-- Remove column cspt_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN cspt_award;
  
-- Remove column csgd_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN csgd_award;

-- Remove column bcag_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN bcag_award;

-- Remove column cslp_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN cslp_award;

-- Remove column program_year_id for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
DROP 
  COLUMN program_year_id;