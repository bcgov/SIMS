UPDATE
  sims.education_programs
SET
  is_aviation_program = NULL
WHERE
  course_load_calculation = 'credit' || (
    course_load_calculation = 'hours'
    AND min_hours_week = 'yes'
  );