-- Remove new column date_of_birth
ALTER TABLE
  students DROP COLUMN IF EXISTS birth_date;

-- Remove new column gender
ALTER TABLE
  students DROP COLUMN IF EXISTS gender;