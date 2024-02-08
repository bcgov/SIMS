--Rollback update completion years to revert the program length option from "60 weeks to less then 2 years" to "1 year to less then 2 years".
UPDATE
  sims.education_programs
SET
  completion_years = '1YearToLessThan2Years'
where
  completion_years = '60WeeksToLessThan2Years';