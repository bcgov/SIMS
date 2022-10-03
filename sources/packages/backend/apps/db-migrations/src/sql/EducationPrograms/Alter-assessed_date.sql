--Drop the NOT NULL and DEFAULT constraint on assessed_date.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    assessed_date DROP NOT NULL,
ALTER COLUMN
    assessed_date DROP DEFAULT;