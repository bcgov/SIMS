--Rename the column submitted_on to submitted_date to align with other tables.
ALTER TABLE
    sims.education_programs RENAME COLUMN submitted_on TO submitted_date;