-- Drop submitted_by from education_programs_offerings table.
ALTER TABLE
    sims.education_programs_offerings DROP COLUMN submitted_by;

-- Drop submitted_by from education_programs_offerings_history table.
ALTER TABLE
    sims.education_programs_offerings_history DROP COLUMN submitted_by;