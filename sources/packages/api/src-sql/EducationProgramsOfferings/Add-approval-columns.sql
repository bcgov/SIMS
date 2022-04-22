--Add column assessed_by to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS assessed_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.education_programs_offerings.assessed_by IS 'User who assessed the offering and updated the status.';

--Add column assessed_date to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS assessed_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.education_programs_offerings.assessed_date IS 'Date-time when the offering was assessed.';

--Add column submitted_date to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS submitted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

COMMENT ON COLUMN sims.education_programs_offerings.submitted_date IS 'Date-time when the offering was submitted.';