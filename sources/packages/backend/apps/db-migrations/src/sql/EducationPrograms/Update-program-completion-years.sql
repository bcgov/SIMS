--Update completion years to replace the existing program length option "1 year to less then 2 years" with the value "60 weeks to less then 2 years".
UPDATE
  sims.education_programs
SET
  completion_years = '60WeeksToLessThan2Years'
where
  completion_years = '1YearToLessThan2Years';