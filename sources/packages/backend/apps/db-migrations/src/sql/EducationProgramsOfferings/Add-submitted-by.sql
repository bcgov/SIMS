-- Add submitted_by to education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings
ADD
    COLUMN IF NOT EXISTS submitted_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.education_programs_offerings.submitted_by IS 'Education program offering submitted by institution user.';

-- Add submitted_by to education_programs_offerings_history table.
ALTER TABLE
    sims.education_programs_offerings_history
ADD
    COLUMN IF NOT EXISTS submitted_by INT NULL DEFAULT NULL REFERENCES sims.users(id) ON DELETE
SET
    NULL;

COMMENT ON COLUMN sims.education_programs_offerings_history.submitted_by IS 'Education program offering submitted by institution user.';

-- Update existing records to set submitted_by with creator value.
UPDATE
    sims.education_programs_offerings
SET
    submitted_by = creator;

UPDATE
    sims.education_programs_offerings_history
SET
    submitted_by = creator;

-- Since creator is nullable don't add a NULL constraint to either table.