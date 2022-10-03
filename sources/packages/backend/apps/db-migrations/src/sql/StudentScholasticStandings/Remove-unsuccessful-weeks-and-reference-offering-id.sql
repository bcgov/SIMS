-- Drop unsuccessful_weeks.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS unsuccessful_weeks;

-- Drop reference_offering_id.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS reference_offering_id;