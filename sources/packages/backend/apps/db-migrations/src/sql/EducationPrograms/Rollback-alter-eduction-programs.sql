--Default value to program description before setting NOT NULL.
update
    sims.education_programs
SET
    program_description = 'Program Default Description'
WHERE
    program_description IS NULL;

--Set NOT NULL constraint on program_description.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_description
SET
    NOT NULL;

--Default constraint for the program_description is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_description DROP DEFAULT;

-- Add has_minimun_age to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS has_minimun_age VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.has_minimun_age IS 'This column respresents the entrance requirement of minimum age of 19 and above.';

-- Remove column institution_program_code.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS institution_program_code;

-- Remove column min_hours_week.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS min_hours_week;

-- Remove column is_aviation_program.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS is_aviation_program;

-- Remove column min_hours_week_avi.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS min_hours_week_avi;

-- Remove column min_high_school.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS min_high_school;

-- Remove column requirements_by_institution.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS requirements_by_institution;

-- Remove column requirements_by_bcita.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS requirements_by_bcita;

-- Remove column has_wil_component.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS has_wil_component;

-- Remove column is_wil_approved.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS is_wil_approved;

-- Remove column wil_program_eligibility.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS wil_program_eligibility;

-- Remove column has_travel.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS has_travel;

-- Remove column travel_program_eligibility.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS travel_program_eligibility;

-- Remove column has_intl_exchange.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS has_intl_exchange;

-- Remove column intl_exchange_program_eligibility.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS intl_exchange_program_eligibility;

-- Remove column program_declaration.
ALTER TABLE
    sims.education_programs DROP COLUMN IF EXISTS program_declaration;