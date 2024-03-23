-- Add column cspt_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
ADD 
  COLUMN cspt_award NUMERIC(10);

COMMENT ON COLUMN sims.sfas_part_time_applications.cspt_award IS 'CSPT Award Amount (sail_extract_data.sail_cspt_amt).';

-- Add column csgd_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
ADD 
  COLUMN csgd_award NUMERIC(10);

COMMENT ON COLUMN sims.sfas_part_time_applications.csgd_award IS 'CSGD Award Amount (sail_extract_data.sail_ptdep_amt).';

-- Add column bcag_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
ADD 
  COLUMN bcag_award NUMERIC(10);

COMMENT ON COLUMN sims.sfas_part_time_applications.bcag_award IS 'BCAG-PT Amount (sail_extract_data.sail_bcag_amt).';

-- Add column cslp_award for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
ADD 
  COLUMN cslp_award NUMERIC(10);

COMMENT ON COLUMN sims.sfas_part_time_applications.cslp_award IS 'CSLP Amount (sail_extract_data.sail_cslp_amt).';

-- Add column program_year_id for SFAS Part Time Application.
ALTER TABLE 
  sims.sfas_part_time_applications 
ADD 
  COLUMN program_year_id NUMERIC(8);

COMMENT ON COLUMN sims.sfas_part_time_applications.program_year_id IS 'Program Year ID associated with application, like 20202021.';
