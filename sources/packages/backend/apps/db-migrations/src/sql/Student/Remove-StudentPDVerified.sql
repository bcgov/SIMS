-- Remove new column pd_verified
ALTER TABLE
  sims.students DROP COLUMN IF EXISTS pd_verified;