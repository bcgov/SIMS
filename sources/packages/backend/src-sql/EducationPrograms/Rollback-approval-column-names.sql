--Renaming the approval columns to rollback.
ALTER TABLE
    sims.education_programs RENAME COLUMN program_status TO approval_status;

ALTER TABLE
    sims.education_programs RENAME COLUMN assessed_by TO status_updated_by;

ALTER TABLE
    sims.education_programs RENAME COLUMN assessed_date TO status_updated_on;