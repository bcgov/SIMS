--Add column offering_status to sims.education_programs_offerings.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS offering_status sims.offering_status NOT NULL DEFAULT 'Approved';

COMMENT ON COLUMN sims.education_programs_offerings.offering_status IS 'Status of the offering.';

--Drop the default value after adding the column.
ALTER TABLE
    sims.education_programs_offerings
ALTER COLUMN
    offering_status DROP DEFAULT;