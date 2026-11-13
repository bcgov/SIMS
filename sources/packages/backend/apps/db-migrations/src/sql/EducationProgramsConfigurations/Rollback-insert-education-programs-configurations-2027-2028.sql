-- Delete the education programs configuration for program year 2027-2028 added on Insert-education-programs-configurations-2027-2028.sql
DELETE FROM
  sims.education_programs_configurations
WHERE
  program_year_id = (
    SELECT
      id
    FROM
      sims.program_years
    WHERE
      program_year = '2027-2028'
  );