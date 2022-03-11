-- Remove new column valid_sin
ALTER TABLE
  sims.students DROP COLUMN IF EXISTS valid_sin;
