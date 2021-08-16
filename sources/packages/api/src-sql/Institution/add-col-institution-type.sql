-- Create program_year_id -  The default 2 is the Program Year 2022-2023, this is used to ensure not null constraint. 
ALTER TABLE
    sims.institutions
ADD
    COLUMN IF NOT EXISTS institution_type_id INT NOT NULL REFERENCES sims.institution_type(id) DEFAULT 1;

COMMENT ON COLUMN sims.institutions.institution_type_id IS 'References the institution type of the institution';

--Default constraint for the program_year_id is removed after the not null constraint is enforced
ALTER TABLE
    sims.institutions
ALTER
    COLUMN institution_type_id DROP DEFAULT;