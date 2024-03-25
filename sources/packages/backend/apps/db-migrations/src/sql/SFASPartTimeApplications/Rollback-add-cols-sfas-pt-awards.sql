-- Remove column cspt_award, csgd_award, bcag_award, cslp_award, program_year_id  for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications DROP COLUMN cspt_award,
  DROP COLUMN csgd_award,
  DROP COLUMN bcag_award,
  DROP COLUMN cslp_award,
  DROP COLUMN program_year_id;