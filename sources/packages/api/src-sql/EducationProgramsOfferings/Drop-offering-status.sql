-- Drop offering_status from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS offering_status;