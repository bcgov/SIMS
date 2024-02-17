-- Rollback the add is_included column.
ALTER TABLE
  sims.sfas_restrictions DROP COLUMN is_included;