-- Rollback the add processed column.
ALTER TABLE
  sims.sfas_restrictions DROP COLUMN processed;