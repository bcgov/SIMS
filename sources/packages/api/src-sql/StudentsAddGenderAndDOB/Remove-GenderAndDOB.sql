-- Remove new column date_of_birth
ALTER TABLE
  sims.students DROP COLUMN IF EXISTS birth_date;

-- Remove new column gender
ALTER TABLE
  sims.students DROP COLUMN IF EXISTS gender;