-- Remove column year_of_study.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS year_of_study;

-- Remove column show_year_of_study.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS show_year_of_study;

-- Remove column has_offering_wil_component.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS has_offering_wil_component;

-- Remove column offering_wil_type.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS offering_wil_type;

-- Remove column study_breaks.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS study_breaks;

-- Remove column offering_declaration.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS offering_declaration;

-- Add break_start_date to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS break_start_date Date;

COMMENT ON COLUMN sims.education_programs_offerings.break_start_date IS 'Offering Break start date.';

-- Add break_end_date to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS break_end_date Date;

COMMENT ON COLUMN sims.education_programs_offerings.break_end_date IS 'Offering Break end date.';