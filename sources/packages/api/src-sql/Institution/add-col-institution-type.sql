-- Add column institution_type_id as we will be storing the institution type of each institution created/modified
ALTER TABLE
    sims.institutions
ADD
    COLUMN IF NOT EXISTS institution_type_id INT NOT NULL REFERENCES sims.institution_type(id) DEFAULT 1;

COMMENT ON COLUMN sims.institutions.institution_type_id IS 'References the institution type of the institution';

--Default constraint for the institution_type_id is removed after the not null constraint is enforced
ALTER TABLE
    sims.institutions
ALTER
    COLUMN institution_type_id DROP DEFAULT;