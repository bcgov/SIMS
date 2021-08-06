-- Add the column part_time_basis_program for Program with a dummy default value.
ALTER TABLE sims.education_programs ADD 
    COLUMN IF NOT EXISTS part_time_basis_program VARCHAR(50) NOT NULL DEFAULT 'no';
COMMENT ON COLUMN sims.education_programs.part_time_basis_program IS 'If part_time_basis_program is yes, then the program is both Full-Time and Part-Time, if part_time_basis_program is no, then the program is only Full-Time basis';


-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.education_programs
    ALTER COLUMN part_time_basis_program DROP DEFAULT;