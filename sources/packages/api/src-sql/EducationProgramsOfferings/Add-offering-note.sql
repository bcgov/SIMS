-- Add offering_note to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS offering_note INT REFERENCES sims.notes(id);

COMMENT ON COLUMN sims.education_programs_offerings.offering_note IS 'Note added by ministry user to either approve or decline an offering.';