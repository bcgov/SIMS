--Add column lacks_study_dates to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS lacks_study_dates BOOLEAN NOT NULL;

COMMENT ON COLUMN sims.education_programs_offerings.lacks_study_dates IS 'Offering does not have Program Dates?';

--Add column lacks_fixed_costs to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS lacks_fixed_costs BOOLEAN NOT NULL;

COMMENT ON COLUMN sims.education_programs_offerings.lacks_fixed_costs IS 'Offering does not have Fixed Costs?';

-- Drop course_load from sims.education_programs_offerings. 
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS course_load;