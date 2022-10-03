--Drop the NOT NULL constraint on program_description.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_description DROP NOT NULL;

--Dropping column with typo(has_minimun_age) and VARCHAR data type.
ALTER TABLE
    sims.education_programs DROP COLUMN has_minimun_age;

-- Add institution_program_code to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS institution_program_code VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.institution_program_code IS 'Institution program code of the given program.';

-- Add min_hours_week to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS min_hours_week VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.min_hours_week IS 'This column represents result for the question, Does this program include a minimum of 20 instructional hours per week?.';

-- Add is_aviation_program to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS is_aviation_program VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.is_aviation_program IS 'This column determines if the given program is aviation program.';

-- Add min_hours_week_avi to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS min_hours_week_avi VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.min_hours_week_avi IS 'This column determines if an aviation program satisfies minimum hours per week.';

-- Add has_minimum_age to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS has_minimum_age BOOLEAN;

COMMENT ON COLUMN sims.education_programs.has_minimum_age IS 'This column represents the entrance requirement of minimum age of 19 and above.';

-- Add min_high_school to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS min_high_school BOOLEAN;

COMMENT ON COLUMN sims.education_programs.min_high_school IS 'This column represents the entrance requirement of minimum grade 12 or equivalent.';

-- Add requirements_by_institution to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS requirements_by_institution BOOLEAN;

COMMENT ON COLUMN sims.education_programs.requirements_by_institution IS 'This column represents the entrance requirement established by the institution that enable completion of the program study.';

-- Add requirements_by_bcita to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS requirements_by_bcita BOOLEAN;

COMMENT ON COLUMN sims.education_programs.requirements_by_bcita IS 'This column represents the entrance requirement set by B.C. ITA.';

-- Add has_wil_component to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS has_wil_component VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs.has_wil_component IS 'This column determines if the program has Work Integrated Learning(WIL) component.';

-- Add is_wil_approved to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS is_wil_approved VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.is_wil_approved IS 'This column determines if WIL is approved by regulator or oversight body.';

-- Add wil_program_eligibility to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS wil_program_eligibility VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.wil_program_eligibility IS 'This column determines if WIL meet the program eligibility requirements according to StudentAid BC policy.';

-- Add has_travel to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS has_travel VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs.has_travel IS 'This column determines if the program has Field trip, field placement, or travel.';

-- Add travel_program_eligibility to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS travel_program_eligibility VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.travel_program_eligibility IS 'This column determines if the Field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy.';

-- Add has_intl_exchange to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS has_intl_exchange VARCHAR(50) NOT NULL DEFAULT 'no';

COMMENT ON COLUMN sims.education_programs.has_intl_exchange IS 'This column determines if the program has international exchange.';

-- Add intl_exchange_program_eligibility to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS intl_exchange_program_eligibility VARCHAR(50);

COMMENT ON COLUMN sims.education_programs.intl_exchange_program_eligibility IS 'This column determines if the international exchange meet the program eligibility requirements according to StudentAid BC policy.';

-- Add program_declaration to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS program_declaration BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN sims.education_programs.program_declaration IS 'This column determines if the international exchange meet the program eligibility requirements according to StudentAid BC policy.';

--Default constraint for the has_wil_component is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    has_wil_component DROP DEFAULT;

--Default constraint for the has_travel is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    has_travel DROP DEFAULT;

--Default constraint for the has_intl_exchange is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    has_intl_exchange DROP DEFAULT;

--Default constraint for the program_declaration is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    program_declaration DROP DEFAULT;