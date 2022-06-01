-- create scholastic_standing_status enum.
CREATE TYPE sims.scholastic_standing_status AS ENUM ('Pending', 'Approved', 'Declined');

-- Add scholastic_standing_status column for sims.student_scholastic_standings and set type to scholastic_standing_status.
ALTER TABLE
  sims.student_scholastic_standings
ADD
  COLUMN IF NOT EXISTS scholastic_standing_status sims.scholastic_standing_status NOT NULL DEFAULT 'Approved';