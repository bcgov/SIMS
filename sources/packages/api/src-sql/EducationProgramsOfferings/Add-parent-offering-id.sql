ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS parent_offering_id INT REFERENCES sims.education_programs_offerings(id);

COMMENT ON COLUMN sims.education_programs_offerings.parent_offering_id IS 'The parent offering from which the current offering was created during request for change.';