-- Add average_hours_study to education_programs table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS average_hours_study INT;

COMMENT ON COLUMN sims.education_programs.has_minimun_age IS 'Average hours of study.';

-- Add has_minimun_age to admission_requirement table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS admission_requirement VARCHAR(50) DEFAULT 'none';

COMMENT ON COLUMN sims.education_programs.admission_requirement IS 'Code for the admission requirements for this program.';

--Default constraint for the admission_requirement is removed after the not null constraint is enforced.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    admission_requirement DROP DEFAULT;

-- Add has_minimun_age to credential_type_other table.
ALTER TABLE
    sims.education_programs
ADD
    COLUMN IF NOT EXISTS credential_type_other VARCHAR(300);

COMMENT ON COLUMN sims.education_programs.credential_type_other IS 'Credential type descritpion when "Other" is selected for credential_type.';