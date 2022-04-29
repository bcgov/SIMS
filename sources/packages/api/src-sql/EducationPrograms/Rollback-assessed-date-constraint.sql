--Update value of assessed date before setting NOT NULL.
UPDATE
    sims.education_programs
SET
    assessed_date = now()
WHERE
    assessed_date IS NULL;

--Set NOT NULL constraint on assessed_date.
ALTER TABLE
    sims.education_programs
ALTER COLUMN
    assessed_date
SET
    NOT NULL,
ALTER COLUMN
    assessed_date
SET
    DEFAULT now();