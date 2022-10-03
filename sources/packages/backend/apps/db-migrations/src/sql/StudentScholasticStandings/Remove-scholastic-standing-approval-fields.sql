-- Drop approval realted fields.
-- Drop approved_data.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS approved_data;

-- Drop assessed_by.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS assessed_by;

-- Drop assessed_date.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS assessed_date;

-- Remove column scholastic_standing_status for student_scholastic_standings.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS scholastic_standing_status;