UPDATE
  education_programs
SET
  is_aviation_program = 'no'
WHERE
  is_aviation_program IS NULL;

ALTER TABLE
  education_programs
ALTER COLUMN
  is_aviation_program
SET
  NOT NULL;