UPDATE
  sims.education_programs
SET
  completion_years = '52WeeksTo59Weeks'
where
  completion_years = '53WeeksTo59Weeks';

UPDATE
  sims.education_programs
SET
  completion_years = '12WeeksToLessThan1Year'
where
  completion_years = '12WeeksTo52Weeks';