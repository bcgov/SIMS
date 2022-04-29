--Renaming the approval columns to be in sync with other entities.
ALTER TABLE
    sims.education_programs RENAME COLUMN approval_status TO program_status;

COMMENT ON COLUMN sims.education_programs.program_status IS 'Indicates the current status of the program.';

ALTER TABLE
    sims.education_programs RENAME COLUMN status_updated_by TO assessed_by;

COMMENT ON COLUMN sims.education_programs.assessed_by IS 'User who assessed the program and updated the status.';

ALTER TABLE
    sims.education_programs RENAME COLUMN status_updated_on TO assessed_date;

COMMENT ON COLUMN sims.education_programs.assessed_date IS 'Date-time when the program was assessed.';