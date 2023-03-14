ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS change_type sims.student_scholastic_standing_change_types NOT NULL DEFAULT 'Student completed program early';

COMMENT ON COLUMN sims.student_scholastic_standings.change_type IS 'Type of the scholastic standing change reported by an institution when the program enrolled by the student was not completed as expected.';

-- Removing the dummy constraint created just to allow us
-- to add a "NOT NULL" column in an existing table.
ALTER TABLE
  sims.student_scholastic_standings
ALTER COLUMN
  change_type DROP DEFAULT;