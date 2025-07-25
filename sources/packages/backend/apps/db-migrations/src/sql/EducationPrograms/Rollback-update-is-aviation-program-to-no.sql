ALTER TABLE
  sims.education_programs
ALTER COLUMN
  is_aviation_program DROP NOT NULL;

UPDATE
  sims.education_programs
SET
  is_aviation_program = NULL
WHERE
  course_load_calculation = 'credit'
  OR (
    course_load_calculation = 'hours'
    AND min_hours_week = 'yes'
  );