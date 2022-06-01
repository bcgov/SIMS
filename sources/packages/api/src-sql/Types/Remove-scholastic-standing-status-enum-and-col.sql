-- Remove column scholastic_standing_status for student_scholastic_standings.
ALTER TABLE
  sims.student_scholastic_standings DROP COLUMN IF EXISTS scholastic_standing_status;

-- Remove the scholastic_standing_status enum.
DROP TYPE sims.scholastic_standing_status;