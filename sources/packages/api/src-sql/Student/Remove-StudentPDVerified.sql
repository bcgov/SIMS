-- Remove new column pd_verified
ALTER TABLE
  students DROP COLUMN IF EXISTS pd_verified;
