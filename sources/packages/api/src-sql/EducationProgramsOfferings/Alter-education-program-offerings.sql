-- Add year_of_study to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS year_of_study INT NOT NULL DEFAULT 1;

COMMENT ON COLUMN sims.education_programs_offerings.year_of_study IS 'Year of study for the study period.';

-- Add show_year_of_study to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS show_year_of_study BOOLEAN;

COMMENT ON COLUMN sims.education_programs_offerings.show_year_of_study IS 'This value determines if we show year of study to students.';

-- Add has_offering_wil_component to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS has_offering_wil_component VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs_offerings.has_offering_wil_component IS 'This column determines if offering has WIL(Work Integrated Learning) component.';

-- Add offering_wil_type to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS offering_wil_type VARCHAR(50);

COMMENT ON COLUMN sims.education_programs_offerings.offering_wil_type IS 'WIL type of the offering WIL component.';

-- Add study_breaks to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS study_breaks JSONB;

COMMENT ON COLUMN sims.education_programs_offerings.study_breaks IS 'Study breaks in offering.';

-- Add offering_declaration to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS offering_declaration BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN sims.education_programs_offerings.offering_declaration IS 'The declaration by user while creating offering.';

--Default constraint for the year_of_study is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    year_of_study DROP DEFAULT;

--Default constraint for the has_offering_wil_component is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    has_offering_wil_component DROP DEFAULT;

--Default constraint for the offering_declaration is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    offering_declaration DROP DEFAULT;

-- Remove column break_start_date
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS break_start_date;

-- Remove column break_end_date
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS break_end_date;