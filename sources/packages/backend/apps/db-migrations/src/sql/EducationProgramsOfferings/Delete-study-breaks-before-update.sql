-- Drop study_breaks_before_update from sims.education_programs_offerings.
ALTER TABLE
  sims.education_programs_offerings DROP COLUMN study_breaks_before_update;

-- Drop study_breaks_before_update from sims.education_programs_offerings_history.
ALTER TABLE
  sims.education_programs_offerings_history DROP COLUMN study_breaks_before_update;