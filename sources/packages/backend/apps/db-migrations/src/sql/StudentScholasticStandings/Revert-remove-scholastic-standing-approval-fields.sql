-- Revert scholastic standing approval fields.
-- Add scholastic_standing_status column for sims.student_scholastic_standings and set type to scholastic_standing_status.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS scholastic_standing_status sims.scholastic_standing_status NOT NULL DEFAULT 'Approved';

-- Create approved_data.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS approved_data JSONB;

COMMENT ON COLUMN sims.student_scholastic_standings.approved_data IS 'Dynamic form data that represents the final data revised by the Ministry.';

-- Create assessed_by.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS assessed_by INT REFERENCES sims.users(id) ON DELETE
SET
  NULL;

COMMENT ON COLUMN sims.student_scholastic_standings.assessed_by IS 'Ministry user that approved or denied the appeal.';

-- Create assessed_date.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS assessed_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sims.student_scholastic_standings.assessed_date IS 'Date that the Ministry approved or denied the appeal.';