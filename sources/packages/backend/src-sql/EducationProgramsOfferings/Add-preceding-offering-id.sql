ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS preceding_offering_id INT REFERENCES sims.education_programs_offerings(id);

COMMENT ON COLUMN sims.education_programs_offerings.preceding_offering_id IS 'The immediate previous offering from which the current offering was created during request for change.';