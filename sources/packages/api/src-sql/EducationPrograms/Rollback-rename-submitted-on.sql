--Rename the column submitted_date to submitted_on to rollback the migration.
ALTER TABLE
    sims.education_programs RENAME COLUMN submitted_date TO submitted_on;