-- Drop lacks_study_dates from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS lacks_study_dates;

-- Drop lacks_fixed_costs from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS lacks_fixed_costs;

--Add column course_load to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS course_load INT;

COMMENT ON COLUMN sims.education_programs_offerings.course_load IS 'Course Load for Part Time intensity program, range between 20 - 59.';
