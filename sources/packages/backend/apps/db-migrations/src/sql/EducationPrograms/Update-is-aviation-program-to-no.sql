UPDATE
  education_programs
SET
  is_aviation_program = 'no'
WHERE
  is_aviation_program IS NULL;