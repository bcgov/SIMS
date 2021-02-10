-- Adding new column date_of_birth
-- Add the column with a dummy default value that will be removed in the next command.
ALTER TABLE  sims.students
    ADD COLUMN IF NOT EXISTS birth_date Date NOT NULL DEFAULT now();

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.students
    ALTER COLUMN birth_date DROP DEFAULT;

COMMENT ON COLUMN sims.students.birth_date
    IS 'Date of birth of the student';

-- Adding new column gender
ALTER TABLE sims.students
    ADD COLUMN IF NOT EXISTS gender character varying(10) NOT NULL DEFAULT 'X';

COMMENT ON COLUMN sims.students.gender
    IS 'Gender of the student';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an exising table.
ALTER TABLE sims.students
    ALTER COLUMN gender DROP DEFAULT;