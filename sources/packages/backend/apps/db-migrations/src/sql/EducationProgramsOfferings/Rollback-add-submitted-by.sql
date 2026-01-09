-- Drop submitted_by from education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN IF EXISTS submitted_by;

-- Drop submitted_by from education_programs_offerings_history table.
ALTER TABLE
    sims.education_programs_offerings_history DROP COLUMN IF EXISTS submitted_by;